import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Field, Input, PasswordInput, PhoneInput, Button, Alert } from '../components/ui';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [devLink, setDevLink] = useState(null);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.register(form);
      if (res.devVerifyUrl) {
        setDevLink(res.devVerifyUrl);
      } else {
        navigate('/login', { state: { justRegistered: true } });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="font-display text-3xl text-harbour">Create your account</h1>
      <p className="mt-2 text-sm text-slate">Browse listings, save preferences, and leave reviews.</p>

      {devLink ? (
        <div className="mt-8 space-y-4">
          <Alert tone="success">
            Account created. No email service is configured for this environment yet, so here's your
            verification link directly:
          </Alert>
          <a href={devLink} className="block break-all text-sm text-brass underline">{devLink}</a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && <Alert>{error}</Alert>}

          <Field label="Full name" htmlFor="fullName">
            <Input id="fullName" required value={form.fullName} onChange={(e) => update('fullName', e.target.value)} />
          </Field>

          <Field label="Email address" htmlFor="email">
            <Input id="email" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
          </Field>

          <Field label="Phone number" htmlFor="phone" hint="Optional">
            <PhoneInput id="phone" value={form.phone} onChange={(v) => update('phone', v)} />
          </Field>

          <Field label="Password" htmlFor="password" hint="At least 8 characters, with a number and a special character.">
            <PasswordInput id="password" required value={form.password} onChange={(e) => update('password', e.target.value)} />
          </Field>

          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-slate">
        Already have an account? <Link to="/login" className="text-brass font-medium">Sign in</Link>
      </p>
    </div>
  );
}
