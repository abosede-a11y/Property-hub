import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Field, Input, Textarea, Button, Alert } from '../components/ui';
import AdminTabs from '../components/AdminTabs';

export default function AdminNewsletter() {
  const { token } = useAuth();
  const [counts, setCounts] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    Promise.all([api.adminListSubscribers(token), api.adminListNewsletterIssues(token)])
      .then(([s, i]) => {
        setCounts(s.counts);
        setIssues(i.issues);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [token]);

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
      <AdminTabs />
      <h1 className="font-display text-3xl text-harbour">Newsletter</h1>

      {counts && (
        <div className="mt-6 flex gap-6 text-sm text-slate">
          <span><span className="font-semibold text-harbour">{counts.subscribed}</span> subscribed</span>
          <span><span className="font-semibold text-harbour">{counts.unsubscribed}</span> unsubscribed</span>
          <span><span className="font-semibold text-harbour">{counts.total}</span> total</span>
        </div>
      )}

      <ComposeForm token={token} onSent={load} />

      <section className="mt-14 pt-10 border-t border-stone-dark">
        <h2 className="font-display text-2xl text-harbour">Sent updates</h2>
        {loading ? (
          <p className="mt-4 text-slate text-sm">Loading…</p>
        ) : issues.length === 0 ? (
          <p className="mt-4 text-slate text-sm">No updates sent yet.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {issues.map((issue) => (
              <li key={issue.id} className="bg-white border border-stone-dark rounded-lg p-5">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-harbour">{issue.subject}</p>
                  <span className="text-xs text-slate">{issue.recipientCount} sent</span>
                </div>
                <p className="mt-2 text-sm text-slate whitespace-pre-line leading-relaxed">{issue.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ComposeForm({ token, onSent }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await api.adminSendNewsletterIssue({ subject, body }, token);
      setSuccess(res.message);
      setSubject('');
      setBody('');
      onSent();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5 max-w-xl">
      <p className="text-sm font-semibold text-harbour">Send an update</p>
      {error && <Alert>{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}
      <Field label="Subject" htmlFor="subject">
        <Input id="subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
      </Field>
      <Field label="Message" htmlFor="body" hint="Sent as plain text, one paragraph per line.">
        <Textarea id="body" required value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <Button type="submit" variant="primary" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send to subscribers'}
      </Button>
    </form>
  );
}
