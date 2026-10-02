import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Button, StarRating, Select } from '../components/ui';

export default function AdminReviews() {
  const { token } = useAuth();
  const [status, setStatus] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.adminListReviews(status, token).then((res) => setReviews(res.reviews)).finally(() => setLoading(false));
  }

  useEffect(load, [status, token]);

  async function moderate(id, next) {
    await api.adminModerateReview(id, next, token);
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-14">
      <h1 className="font-display text-3xl text-harbour">Moderate reviews</h1>

      <div className="mt-6">
        <Select className="max-w-[200px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {loading ? (
        <p className="mt-8 text-slate">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="mt-8 text-slate text-sm">No {status} reviews.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="bg-white border border-stone-dark rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <Link to={`/listings/${r.listingId}`} className="font-medium text-harbour hover:text-brass">
                    {r.listingTitle}
                  </Link>
                  <p className="text-xs text-slate mt-0.5">by {r.reviewerName}</p>
                </div>
                <StarRating value={r.rating} size={14} />
              </div>
              <p className="mt-3 text-sm text-slate leading-relaxed">{r.body}</p>
              {status === 'pending' && (
                <div className="mt-4 flex gap-3">
                  <Button variant="primary" onClick={() => moderate(r.id, 'approved')}>Approve</Button>
                  <Button variant="danger" onClick={() => moderate(r.id, 'rejected')}>Reject</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
