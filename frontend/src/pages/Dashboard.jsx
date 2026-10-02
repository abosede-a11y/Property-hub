import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Button, StarRating } from '../components/ui';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [myReviews, setMyReviews] = useState([]);

  useEffect(() => {
    api.myReviews(token).then((res) => setMyReviews(res.reviews)).catch(() => {});
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-14">
      <h1 className="font-display text-3xl text-harbour">Welcome back, {user?.fullName?.split(' ')[0]}.</h1>
      <p className="mt-2 text-slate">Here's what's happening with your Property Hub account.</p>

      <div className="mt-10 grid sm:grid-cols-2 gap-6">
        <div className="bg-white border border-stone-dark rounded-lg p-6">
          <p className="font-display text-lg text-harbour">Your profile</p>
          <p className="mt-2 text-sm text-slate">Keep your details and property preferences up to date.</p>
          <Button as={Link} to="/profile" variant="secondary" className="mt-4">Manage profile →</Button>
        </div>
        <div className="bg-white border border-stone-dark rounded-lg p-6">
          <p className="font-display text-lg text-harbour">Find your next place</p>
          <p className="mt-2 text-sm text-slate">Browse listings across the UK and filter by what matters to you.</p>
          <Button as={Link} to="/listings" variant="secondary" className="mt-4">Browse listings →</Button>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl text-harbour">Your reviews</h2>
        {myReviews.length === 0 ? (
          <p className="mt-4 text-sm text-slate">You haven't left any reviews yet.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {myReviews.map((r) => (
              <li key={r.id} className="bg-white border border-stone-dark rounded-lg p-5">
                <div className="flex items-center justify-between">
                  <Link to={`/listings/${r.listingId}`} className="font-medium text-harbour hover:text-brass">
                    {r.listingTitle}
                  </Link>
                  <StatusBadge status={r.status} />
                </div>
                <div className="mt-2"><StarRating value={r.rating} size={13} /></div>
                <p className="mt-2 text-sm text-slate leading-relaxed">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-brass-light text-brass-deep',
    approved: 'bg-hedge-light text-hedge',
    rejected: 'bg-rust-light text-rust',
  };
  const labels = { pending: 'Awaiting approval', approved: 'Published', rejected: 'Not published' };
  return <span className={`text-xs font-medium px-2 py-1 rounded-sm ${styles[status]}`}>{labels[status]}</span>;
}
