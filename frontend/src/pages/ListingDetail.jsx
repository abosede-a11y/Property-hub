import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button, StarRating, StarInput, Textarea, Alert, IconBed, IconBath, IconPin } from '../components/ui';

function formatPrice(listing) {
  const amount = listing.price.toLocaleString('en-GB', { maximumFractionDigits: 0 });
  return listing.listingType === 'rent' ? `£${amount} pcm` : `£${amount}`;
}

export default function ListingDetail() {
  const { id } = useParams();
  const { isAuthenticated, token } = useAuth();
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  function loadAll() {
    Promise.all([api.getListing(id), api.listReviews(id)])
      .then(([l, r]) => {
        setListing(l.listing);
        setReviews(r.reviews);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [id]);

  if (loading) return <div className="max-w-4xl mx-auto px-5 py-16 text-slate">Loading…</div>;
  if (!listing) return <div className="max-w-4xl mx-auto px-5 py-16"><Alert>Listing not found.</Alert></div>;

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-14">
      <Link to="/listings" className="text-sm text-brass font-medium">← Back to listings</Link>

      <div className="mt-4 h-56 sm:h-72 rounded-lg bg-gradient-to-br from-harbour to-harbour-light" />

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-harbour">{listing.title}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-slate">
            <IconPin /> {listing.addressLine1}, {listing.city} {listing.postcode}
          </p>
        </div>
        <span className="font-display text-2xl text-harbour">{formatPrice(listing)}</span>
      </div>

      <div className="mt-4 flex items-center gap-6 text-sm text-slate">
        {listing.bedrooms != null && <span className="flex items-center gap-1.5"><IconBed /> {listing.bedrooms} bed</span>}
        {listing.bathrooms != null && <span className="flex items-center gap-1.5"><IconBath /> {listing.bathrooms} bath</span>}
        <span className="capitalize">{listing.propertyType}</span>
        <span>{listing.listingType === 'rent' ? 'To let' : 'For sale'}</span>
      </div>

      {listing.reviewCount > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <StarRating value={listing.avgRating} />
          <span className="text-sm text-slate">{listing.avgRating.toFixed(1)} · {listing.reviewCount} review{listing.reviewCount === 1 ? '' : 's'}</span>
        </div>
      )}

      <p className="mt-6 text-slate leading-relaxed max-w-2xl">{listing.description}</p>

      <section className="mt-14 pt-10 border-t border-stone-dark">
        <h2 className="font-display text-2xl text-harbour">Reviews</h2>

        {reviews.length === 0 ? (
          <p className="mt-4 text-slate text-sm">No reviews yet — be the first to share your experience.</p>
        ) : (
          <ul className="mt-6 space-y-6">
            {reviews.map((r) => (
              <li key={r.id} className="border-b border-stone-dark pb-6 last:border-0">
                <div className="flex items-center gap-3">
                  <StarRating value={r.rating} size={14} />
                  <span className="text-sm font-medium text-harbour">{r.reviewerName}</span>
                </div>
                <p className="mt-2 text-sm text-slate leading-relaxed">{r.body}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10">
          {isAuthenticated ? (
            <ReviewForm listingId={id} token={token} onSubmitted={loadAll} />
          ) : (
            <Alert tone="info">
              <Link to="/login" className="underline font-medium">Sign in</Link> to leave a review for this property.
            </Alert>
          )}
        </div>
      </section>
    </div>
  );
}

function ReviewForm({ listingId, token, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!rating) {
      setError('Choose a rating between 1 and 5.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.createReview(listingId, { rating, body }, token);
      setSuccess(res.message);
      setBody('');
      setRating(0);
      onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <p className="text-sm font-semibold text-harbour">Leave a review</p>
      {error && <Alert>{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}
      <StarInput value={rating} onChange={setRating} />
      <Textarea placeholder="Share your experience with this property…" value={body} onChange={(e) => setBody(e.target.value)} required />
      <Button type="submit" variant="primary" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit review'}
      </Button>
    </form>
  );
}
