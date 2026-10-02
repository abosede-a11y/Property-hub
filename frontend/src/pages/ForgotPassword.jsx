import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Field, Input, Button, Alert } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [devLink, setDevLink] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.forgotPassword(email);
      setSubmitted(true);
      if (res.devResetUrl) setDevLink(res.devResetUrl);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="font-display text-3xl text-harbour">Reset your password</h1>
      <p className="mt-2 text-sm text-slate">We'll send a reset link to your registered email address.</p>

      {submitted ? (
        <div className="mt-8 space-y-4">
          <Alert tone="success">If that email exists, a reset link has been sent.</Alert>
          {devLink && (
            <>
              <p className="text-xs text-slate">No email service is configured yet, so here's your link directly:</p>
              <a href={devLink} className="block break-all text-sm text-brass underline">{devLink}</a>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field label="Email address" htmlFor="email">
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-slate">
        <Link to="/login" className="text-brass font-medium">Back to sign in</Link>
      </p>
    </div>
  );
}
