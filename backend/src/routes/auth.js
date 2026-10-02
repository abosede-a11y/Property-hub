const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Resend } = require('resend');
const { pool } = require('../db/pool');
const { signAuthToken } = require('../utils/token');
const {
  isValidEmail,
  isValidPassword,
  PASSWORD_HINT,
  isValidPhone,
  isValidPostcode,
  PREFERRED_PROPERTY_TYPES,
} = require('../utils/validators');
const { requireAuth } = require('../middleware/auth');
const { buildEmailHtml } = require('../utils/emailTemplate');

const router = express.Router();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL || 'Property Hub <onboarding@resend.dev>';

function publicUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    emailVerified: row.email_verified,
    phone: row.phone,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    postcode: row.postcode,
    country: row.country,
    preferredLocation: row.preferred_location,
    preferredPropertyType: row.preferred_property_type,
  };
}

// Sends an email via Resend if configured. Returns { attempted, sent } --
// `attempted` is true whenever Resend was actually called (regardless of
// outcome), and is used to decide whether to fall back to exposing the raw
// link in the API response. This deliberately does NOT fall back to
// exposing the link just because Resend failed once it's configured --
// that would leak sensitive links in production. It only falls back when
// no email provider is configured at all, so the flow stays testable
// before RESEND_API_KEY is set up.
async function sendEmail({ to, subject, heading, bodyHtml, ctaText, ctaUrl, footnote }) {
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not set. Would have sent "${subject}" to ${to}: ${ctaUrl}`);
    return { attempted: false, sent: false };
  }

  try {
    const html = buildEmailHtml({ heading, bodyHtml, ctaText, ctaUrl, footnote });
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error(`[email] Resend rejected "${subject}" to ${to}:`, error.message || error);
      return { attempted: true, sent: false };
    }
    console.log(`[email] Sent "${subject}" to ${to}`);
    return { attempted: true, sent: true };
  } catch (err) {
    console.error(`[email] Resend send failed for "${subject}" to ${to}:`, err.message);
    return { attempted: true, sent: false };
  }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { fullName, email, password, phone } = req.body || {};

  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: 'Full name is required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: PASSWORD_HINT });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'Enter a valid phone number, e.g. 07700 900123.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone, verification_token, verification_token_expires)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [fullName.trim(), email.toLowerCase(), passwordHash, phone || null, verificationToken, verificationExpires]
    );

    const user = result.rows[0];
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

    const { attempted } = await sendEmail({
      to: user.email,
      subject: 'Verify your Property Hub account',
      heading: 'Confirm your email address',
      bodyHtml: `<p>Welcome to Property Hub, ${user.full_name.split(' ')[0]}. Confirm your email address to start browsing listings, saving searches and leaving reviews.</p>`,
      ctaText: 'Verify email',
      ctaUrl: verifyUrl,
      footnote: 'This link expires in 24 hours. If you did not create a Property Hub account, you can ignore this email.',
    });

    res.status(201).json({
      ok: true,
      message: 'Account created. Check your email to verify your address before signing in.',
      devVerifyUrl: attempted ? undefined : verifyUrl,
    });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: 'Something went wrong creating your account.' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Verification link is missing or invalid.' });

  try {
    const result = await pool.query(
      'SELECT id, verification_token_expires FROM users WHERE verification_token = $1',
      [token]
    );
    const user = result.rows[0];

    if (!user || !user.verification_token_expires || new Date(user.verification_token_expires) < new Date()) {
      return res.status(400).json({ error: 'This verification link is invalid or has expired.' });
    }

    await pool.query(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = $1',
      [user.id]
    );

    res.json({ ok: true, message: 'Your email is verified. You can now sign in.' });
  } catch (err) {
    console.error('[auth/verify-email]', err);
    res.status(500).json({ error: 'Something went wrong verifying your email.' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body || {};
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];

    // Same response whether or not the account exists / is already verified,
    // so we don't leak account existence.
    if (!user || user.email_verified) {
      return res.json({ ok: true, message: 'If that account needs verifying, a new link has been sent.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await pool.query(
      'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
      [verificationToken, verificationExpires, user.id]
    );

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    const { attempted } = await sendEmail({
      to: user.email,
      subject: 'Verify your Property Hub account',
      heading: 'Confirm your email address',
      bodyHtml: `<p>Here's a fresh verification link for your Property Hub account.</p>`,
      ctaText: 'Verify email',
      ctaUrl: verifyUrl,
      footnote: 'This link expires in 24 hours.',
    });

    res.json({
      ok: true,
      message: 'If that account needs verifying, a new link has been sent.',
      devVerifyUrl: attempted ? undefined : verifyUrl,
    });
  } catch (err) {
    console.error('[auth/resend-verification]', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'That email and password combination is incorrect.' });
    }

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      return res.status(401).json({ error: 'That email and password combination is incorrect.' });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Verify your email address before signing in.',
        needsVerification: true,
      });
    }

    const token = signAuthToken({ id: user.id, email: user.email });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Something went wrong signing you in.' });
  }
});

// POST /api/auth/logout
// Stateless JWT: logging out is handled client-side by discarding the
// token. This endpoint exists so the frontend has an explicit action to
// call, and so a future move to refresh-token/session storage is a
// backend-only change.
router.post('/logout', requireAuth, (req, res) => {
  res.json({ ok: true });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  try {
    const result = await pool.query('SELECT id, full_name FROM users WHERE email = $1', [email.toLowerCase()]);

    // Always respond the same way whether or not the account exists, so we
    // don't leak which emails are registered.
    if (!result.rows.length) {
      return res.json({ ok: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, expires, user.id]
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const { attempted } = await sendEmail({
      to: email,
      subject: 'Reset your Property Hub password',
      heading: 'Reset your password',
      bodyHtml: `<p>We received a request to reset the password on your Property Hub account.</p>`,
      ctaText: 'Reset password',
      ctaUrl: resetUrl,
      footnote: "This link expires in 30 minutes. If you didn't request this, you can ignore this email.",
    });

    res.json({
      ok: true,
      message: 'If that email exists, a reset link has been sent.',
      devResetUrl: attempted ? undefined : resetUrl,
    });
  } catch (err) {
    console.error('[auth/forgot-password]', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body || {};

  if (!token) {
    return res.status(400).json({ error: 'Reset link is missing or invalid.' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: PASSWORD_HINT });
  }

  try {
    const result = await pool.query(
      'SELECT id, reset_token_expires FROM users WHERE reset_token = $1',
      [token]
    );
    const user = result.rows[0];

    if (!user || !user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [passwordHash, user.id]
    );

    res.json({ ok: true, message: 'Your password has been reset. You can now sign in.' });
  } catch (err) {
    console.error('[auth/reset-password]', err);
    res.status(500).json({ error: 'Something went wrong resetting your password.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    res.json({ user: publicUser(result.rows[0]) });
  } catch (err) {
    console.error('[auth/me]', err);
    res.status(500).json({ error: 'Something went wrong loading your profile.' });
  }
});

// PATCH /api/auth/profile - "Manage Profile": update details/preferences,
// and remove unwanted information (send null/empty for a field to clear
// it). Changing the email address requires re-entering the current
// password, since it changes how the account is reached and signed into.
router.patch('/profile', requireAuth, async (req, res) => {
  const {
    fullName,
    email,
    currentPassword,
    phone,
    addressLine1,
    addressLine2,
    city,
    postcode,
    country,
    preferredLocation,
    preferredPropertyType,
  } = req.body || {};

  if (phone !== undefined && !isValidPhone(phone)) {
    return res.status(400).json({ error: 'Enter a valid phone number, e.g. 07700 900123.' });
  }
  if (postcode !== undefined && !isValidPostcode(postcode)) {
    return res.status(400).json({ error: 'Enter a valid UK postcode.' });
  }
  if (preferredPropertyType !== undefined && preferredPropertyType !== null && preferredPropertyType !== '' &&
      !PREFERRED_PROPERTY_TYPES.includes(preferredPropertyType)) {
    return res.status(400).json({ error: 'Choose a valid property preference.' });
  }

  try {
    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Account not found.' });
    const current = existing.rows[0];

    // Changing email requires password re-authentication before saving.
    let nextEmail = current.email;
    if (email !== undefined && email.toLowerCase() !== current.email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Enter a valid email address.' });
      }
      if (!currentPassword) {
        return res.status(400).json({ error: 'Enter your current password to change your email address.' });
      }
      const matches = await bcrypt.compare(currentPassword, current.password_hash);
      if (!matches) {
        return res.status(401).json({ error: 'Your current password is incorrect.' });
      }
      const taken = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [
        email.toLowerCase(),
        current.id,
      ]);
      if (taken.rows.length) {
        return res.status(409).json({ error: 'Another account already uses that email address.' });
      }
      nextEmail = email.toLowerCase();
    }

    const result = await pool.query(
      `UPDATE users
       SET full_name = $1, email = $2, phone = $3,
           address_line1 = $4, address_line2 = $5, city = $6, postcode = $7, country = $8,
           preferred_location = $9, preferred_property_type = $10
       WHERE id = $11 RETURNING *`,
      [
        fullName?.trim() || current.full_name,
        nextEmail,
        phone !== undefined ? (phone || null) : current.phone,
        addressLine1 !== undefined ? (addressLine1 || null) : current.address_line1,
        addressLine2 !== undefined ? (addressLine2 || null) : current.address_line2,
        city !== undefined ? (city || null) : current.city,
        postcode !== undefined ? (postcode || null) : current.postcode,
        country !== undefined ? (country || null) : current.country,
        preferredLocation !== undefined ? (preferredLocation || null) : current.preferred_location,
        preferredPropertyType !== undefined ? (preferredPropertyType || null) : current.preferred_property_type,
        current.id,
      ]
    );

    res.json({ user: publicUser(result.rows[0]) });
  } catch (err) {
    console.error('[auth/update-profile]', err);
    res.status(500).json({ error: 'Something went wrong saving your profile.' });
  }
});

// PATCH /api/auth/password - change password while signed in (requires the
// current password, unlike the forgot-password reset-token flow).
router.patch('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword) {
    return res.status(400).json({ error: 'Enter your current password.' });
  }
  if (!isValidPassword(newPassword)) {
    return res.status(400).json({ error: PASSWORD_HINT });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'Account not found.' });

    const matches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!matches) {
      return res.status(401).json({ error: 'Your current password is incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user.id]);

    res.json({ ok: true, message: 'Your password has been updated.' });
  } catch (err) {
    console.error('[auth/change-password]', err);
    res.status(500).json({ error: 'Something went wrong changing your password.' });
  }
});

module.exports = router;
