import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function NewsletterSignup({ variant = 'dark' }) {
  const [form, setForm] = useState({ name: '', email: '', agreeToTerms: false });
  const [status, setStatus] = useState('idle'); // idle | submitting | done
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('submitting');
    try {
      await api.subscribeNewsletter(form);
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  }

  const light = variant === 'light';

  if (status === 'done') {
    return (
      <p className={`text-sm ${light ? 'text-hedge' : 'text-brass'}`}>
        You&rsquo;re subscribed &mdash; thanks for joining the newsletter.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-sm" aria-label="Newsletter subscription">
      {error && <p className="text-xs text-rust">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          required
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={`flex-1 rounded-[3px] px-3 py-2 text-sm ${light ? 'border border-stone-dark bg-white text-ink' : 'bg-harbour-light/40 border border-chalk/20 text-chalk placeholder:text-chalk/50'}`}
        />
        <input
          type="email"
          required
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className={`flex-1 rounded-[3px] px-3 py-2 text-sm ${light ? 'border border-stone-dark bg-white text-ink' : 'bg-harbour-light/40 border border-chalk/20 text-chalk placeholder:text-chalk/50'}`}
        />
      </div>
      <label className={`flex items-start gap-2 text-xs ${light ? 'text-slate' : 'text-chalk/60'}`}>
        <input
          type="checkbox"
          required
          checked={form.agreeToTerms}
          onChange={(e) => setForm((f) => ({ ...f, agreeToTerms: e.target.checked }))}
          className="mt-0.5"
        />
        <span>
          I agree to the <Link to="/terms" className="underline hover:text-brass">terms and conditions</Link>.
        </span>
      </label>
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex items-center px-5 py-2 text-sm font-semibold rounded-[3px] bg-brass text-harbour-deep hover:bg-brass-deep transition-colors disabled:opacity-50"
      >
        {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
      </button>
    </form>
  );
}
