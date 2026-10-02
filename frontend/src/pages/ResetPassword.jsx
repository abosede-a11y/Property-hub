import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Field, PasswordInput, Button, Alert } from '../components/ui';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.resetPassword({ token, password });
      navigate('/login', { state: { passwordReset: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-5 py-16">
        <Alert>Reset link is missing or invalid.</Alert>
        <Link to="/forgot-password" className="mt-4 inline-block text-brass font-medium">Request a new link →</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="font-display text-3xl text-harbour">Set a new password</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && <Alert>{error}</Alert>}
        <Field label="New password" htmlFor="password" hint="At least 8 characters, with a number and a special character.">
          <PasswordInput id="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? 'Saving…' : 'Reset password'}
        </Button>
      </form>
    </div>
  );
}
