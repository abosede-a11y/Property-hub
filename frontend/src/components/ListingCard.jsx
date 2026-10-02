import { Link } from 'react-router-dom';
import { IconBed, IconBath, IconPin, StarRating } from './ui';

function formatPrice(listing) {
  const amount = listing.price.toLocaleString('en-GB', { maximumFractionDigits: 0 });
  return listing.listingType === 'rent' ? `£${amount} pcm` : `£${amount}`;
}

export default function ListingCard({ listing, featured = false }) {
  return (
    <Link
      to={`/listings/${listing.id}`}
      className={`group block bg-white border border-stone-dark rounded-lg overflow-hidden hover:border-brass transition-colors ${featured ? 'shadow-sm' : ''}`}
    >
      <div className="h-40 bg-gradient-to-br from-harbour to-harbour-light flex items-end p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-chalk/90 bg-harbour-deep/60 px-2 py-1 rounded-sm">
          {listing.listingType === 'rent' ? 'To let' : 'For sale'}
        </span>
      </div>
      <div className="p-5">
        <p className="font-display text-lg text-harbour leading-snug group-hover:text-brass transition-colors">
          {listing.title}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate">
          <IconPin /> {listing.city}
        </p>
        <div className="mt-3 flex items-center gap-4 text-sm text-slate">
          {listing.bedrooms != null && (
            <span className="flex items-center gap-1"><IconBed /> {listing.bedrooms}</span>
          )}
          {listing.bathrooms != null && (
            <span className="flex items-center gap-1"><IconBath /> {listing.bathrooms}</span>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-xl text-harbour">{formatPrice(listing)}</span>
          {listing.reviewCount > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating value={listing.avgRating} size={13} />
              <span className="text-xs text-slate">({listing.reviewCount})</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
