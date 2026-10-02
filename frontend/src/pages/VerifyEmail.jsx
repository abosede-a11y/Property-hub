import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Alert } from '../components/ui';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification link is missing or invalid.');
      return;
    }
    api.verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [token]);

  return (
    <div className="max-w-md mx-auto px-5 py-20 text-center">
      <h1 className="font-display text-3xl text-harbour">Verify your email</h1>
      <div className="mt-8">
        {status === 'loading' && <p className="text-slate">Verifying…</p>}
        {status === 'success' && (
          <>
            <Alert tone="success">{message}</Alert>
            <Link to="/login" className="mt-6 inline-block text-brass font-medium">Continue to sign in →</Link>
          </>
        )}
        {status === 'error' && <Alert>{message}</Alert>}
      </div>
    </div>
  );
}
