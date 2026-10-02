import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Field, Input, PasswordInput, Button, Alert } from '../components/ui';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resent, setResent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setSubmitting(true);
    try {
      const res = await api.login(form);
      login(res.token, res.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      if (err.needsVerification) setNeedsVerification(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    try {
      await api.resendVerification(form.email);
      setResent(true);
    } catch {
      // resend endpoint always responds ok:true; ignore
      setResent(true);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="font-display text-3xl text-harbour">Sign in</h1>
      <p className="mt-2 text-sm text-slate">Welcome back to Property Hub.</p>

      {location.state?.justRegistered && (
        <div className="mt-6"><Alert tone="success">Check your email to verify your address, then sign in.</Alert></div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <Alert>
            {error}
            {needsVerification && (
              <div className="mt-2">
                {resent ? (
                  <span className="text-hedge">A new verification link has been sent.</span>
                ) : (
                  <button type="button" onClick={handleResend} className="underline font-medium">
                    Resend verification email
                  </button>
                )}
              </div>
            )}
          </Alert>
        )}

        <Field label="Email address" htmlFor="email">
          <Input id="email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </Field>

        <Field label="Password" htmlFor="password">
          <PasswordInput id="password" required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
        </Field>

        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-brass font-medium">Forgot password?</Link>
        </div>

        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate">
        Need an account? <Link to="/signup" className="text-brass font-medium">Create one</Link>
      </p>
    </div>
  );
}
