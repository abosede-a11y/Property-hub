const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { isValidEmail } = require('../utils/validators');
const { sendEmail } = require('../utils/email');

const router = express.Router();

function publicSubscriber(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    subscribedAt: row.subscribed_at,
    unsubscribedAt: row.unsubscribed_at,
  };
}

function publicIssue(row) {
  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    recipientCount: row.recipient_count,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  };
}

function unsubscribeUrl(token) {
  return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe?token=${token}`;
}

// POST /api/newsletter/subscribe - public, no account required.
router.post('/newsletter/subscribe', async (req, res) => {
  const { name, email, agreeToTerms } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Enter your name.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (!agreeToTerms) {
    return res.status(400).json({ error: 'You must agree to the terms and conditions to subscribe.' });
  }

  try {
    const existing = await pool.query('SELECT * FROM newsletter_subscribers WHERE email = $1', [email.toLowerCase()]);

    let subscriber;
    if (existing.rows.length) {
      // Re-subscribing (or already subscribed) -- update in place rather
      // than erroring, so someone who unsubscribed can sign back up.
      const result = await pool.query(
        `UPDATE newsletter_subscribers
         SET name = $1, status = 'subscribed', subscribed_at = now(), unsubscribed_at = NULL
         WHERE id = $2 RETURNING *`,
        [name.trim(), existing.rows[0].id]
      );
      subscriber = result.rows[0];
    } else {
      const token = crypto.randomBytes(24).toString('hex');
      const result = await pool.query(
        `INSERT INTO newsletter_subscribers (name, email, unsubscribe_token)
         VALUES ($1, $2, $3) RETURNING *`,
        [name.trim(), email.toLowerCase(), token]
      );
      subscriber = result.rows[0];
    }

    // Best-effort welcome email -- doesn't block the subscribe response.
    sendEmail({
      to: subscriber.email,
      subject: 'You’re subscribed to the Property Hub newsletter',
      heading: `Welcome, ${subscriber.name.split(' ')[0]}.`,
      bodyHtml: '<p>You’ll now get updates about new property listings and partner agencies by email.</p>',
      ctaText: 'Browse listings',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/listings`,
      footnote: `You can unsubscribe at any time: <a href="${unsubscribeUrl(subscriber.unsubscribe_token)}">unsubscribe</a>.`,
    }).catch(() => {});

    res.status(201).json({ ok: true, message: 'You’re subscribed.', subscriber: publicSubscriber(subscriber) });
  } catch (err) {
    console.error('[newsletter/subscribe]', err);
    res.status(500).json({ error: 'Something went wrong subscribing you.' });
  }
});

// GET /api/newsletter/unsubscribe?token=... - look up without unsubscribing,
// so the frontend can show "Unsubscribe <email>?" before anything happens.
router.get('/newsletter/unsubscribe', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'This unsubscribe link is missing or invalid.' });

  try {
    const result = await pool.query('SELECT * FROM newsletter_subscribers WHERE unsubscribe_token = $1', [token]);
    if (!result.rows.length) return res.status(404).json({ error: 'This unsubscribe link is invalid.' });
    res.json({ subscriber: publicSubscriber(result.rows[0]) });
  } catch (err) {
    console.error('[newsletter/unsubscribe-lookup]', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// POST /api/newsletter/unsubscribe - actually performs the unsubscribe.
router.post('/newsletter/unsubscribe', async (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'This unsubscribe link is missing or invalid.' });

  try {
    const result = await pool.query(
      `UPDATE newsletter_subscribers
       SET status = 'unsubscribed', unsubscribed_at = now()
       WHERE unsubscribe_token = $1 RETURNING *`,
      [token]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'This unsubscribe link is invalid.' });
    res.json({ ok: true, message: 'You’ve been unsubscribed.', subscriber: publicSubscriber(result.rows[0]) });
  } catch (err) {
    console.error('[newsletter/unsubscribe]', err);
    res.status(500).json({ error: 'Something went wrong unsubscribing you.' });
  }
});

// --- Admin ---

// GET /api/admin/newsletter/subscribers
router.get('/admin/newsletter/subscribers', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC');
    const subscribed = result.rows.filter((r) => r.status === 'subscribed').length;
    res.json({
      subscribers: result.rows.map(publicSubscriber),
      counts: { subscribed, unsubscribed: result.rows.length - subscribed, total: result.rows.length },
    });
  } catch (err) {
    console.error('[admin/newsletter/subscribers]', err);
    res.status(500).json({ error: 'Something went wrong loading subscribers.' });
  }
});

// GET /api/admin/newsletter/issues
router.get('/admin/newsletter/issues', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM newsletter_issues ORDER BY created_at DESC');
    res.json({ issues: result.rows.map(publicIssue) });
  } catch (err) {
    console.error('[admin/newsletter/issues/list]', err);
    res.status(500).json({ error: 'Something went wrong loading past updates.' });
  }
});

// POST /api/admin/newsletter/issues - compose and immediately send an
// update to every currently-subscribed address.
router.post('/admin/newsletter/issues', requireAuth, requireAdmin, async (req, res) => {
  const { subject, body } = req.body || {};
  if (!subject || !subject.trim()) return res.status(400).json({ error: 'Give the update a subject line.' });
  if (!body || !body.trim()) return res.status(400).json({ error: 'Write the update’s content.' });

  try {
    const subscribers = await pool.query(
      "SELECT * FROM newsletter_subscribers WHERE status = 'subscribed'"
    );

    const issueResult = await pool.query(
      `INSERT INTO newsletter_issues (subject, body, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [subject.trim(), body.trim(), req.user.id]
    );
    let issue = issueResult.rows[0];

    let sentCount = 0;
    for (const subscriber of subscribers.rows) {
      // eslint-disable-next-line no-await-in-loop
      const { sent } = await sendEmail({
        to: subscriber.email,
        subject: subject.trim(),
        heading: subject.trim(),
        bodyHtml: body
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((line) => `<p>${line}</p>`)
          .join(''),
        ctaText: 'View on Property Hub',
        ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/listings`,
        footnote: `You're receiving this because you subscribed to Property Hub updates. <a href="${unsubscribeUrl(subscriber.unsubscribe_token)}">Unsubscribe</a>.`,
      });
      if (sent) sentCount += 1;
    }

    const updated = await pool.query(
      `UPDATE newsletter_issues SET sent_at = now(), recipient_count = $1 WHERE id = $2 RETURNING *`,
      [sentCount, issue.id]
    );
    issue = updated.rows[0];

    res.status(201).json({
      ok: true,
      message: subscribers.rows.length
        ? `Sent to ${sentCount} of ${subscribers.rows.length} subscriber(s).`
        : 'Saved. There are no subscribers to send to yet.',
      issue: publicIssue(issue),
    });
  } catch (err) {
    console.error('[admin/newsletter/issues/create]', err);
    res.status(500).json({ error: 'Something went wrong sending the update.' });
  }
});

module.exports = router;
