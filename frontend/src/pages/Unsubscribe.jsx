import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Button, Alert } from '../components/ui';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('loading'); // loading | ready | done | error
  const [subscriber, setSubscriber] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('This unsubscribe link is missing or invalid.');
      return;
    }
    api.lookupUnsubscribe(token)
      .then((res) => {
        setSubscriber(res.subscriber);
        setStatus(res.subscriber.status === 'unsubscribed' ? 'done' : 'ready');
      })
      .catch((err) => {
        setStatus('error');
        setError(err.message);
      });
  }, [token]);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await api.confirmUnsubscribe(token);
      setStatus('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-20 text-center">
      <h1 className="font-display text-3xl text-harbour">Newsletter subscription</h1>

      <div className="mt-8">
        {status === 'loading' && <p className="text-slate">Loading…</p>}

        {status === 'ready' && subscriber && (
          <div className="space-y-5">
            <p className="text-slate">
              Unsubscribe <span className="font-medium text-harbour">{subscriber.email}</span> from the Property Hub newsletter?
            </p>
            <Button variant="danger" onClick={handleConfirm} disabled={submitting}>
              {submitting ? 'Unsubscribing…' : 'Unsubscribe me'}
            </Button>
          </div>
        )}

        {status === 'done' && (
          <>
            <Alert tone="success">You&rsquo;ve been unsubscribed. You won&rsquo;t receive any more newsletter updates.</Alert>
            <Link to="/" className="mt-6 inline-block text-brass font-medium">Back to Property Hub →</Link>
          </>
        )}

        {status === 'error' && <Alert>{error}</Alert>}
      </div>
    </div>
  );
}
