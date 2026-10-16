const { Resend } = require('resend');
const { buildEmailHtml } = require('./emailTemplate');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL || 'Property Hub <onboarding@resend.dev>';

// Sends an email via Resend if configured. Returns { attempted, sent } --
// `attempted` is true whenever Resend was actually called (regardless of
// outcome), and is used by callers to decide whether to fall back to
// exposing a raw link/action in the API response. This deliberately does
// NOT fall back just because Resend failed once it's configured -- that
// would leak sensitive links in production. It only falls back when no
// email provider is configured at all, so flows stay testable before
// RESEND_API_KEY is set up.
async function sendEmail({ to, subject, heading, bodyHtml, ctaText, ctaUrl, footnote }) {
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not set. Would have sent "${subject}" to ${to}${ctaUrl ? `: ${ctaUrl}` : ''}`);
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

module.exports = { sendEmail, resendConfigured: Boolean(resend) };
