import { useEffect, useState } from 'react';
import { api } from '../api/client';
import ListingCard from '../components/ListingCard';
import { Select, Input } from '../components/ui';

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', propertyType: '', listingType: '' });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.propertyType) params.set('propertyType', filters.propertyType);
    if (filters.listingType) params.set('listingType', filters.listingType);
    const query = params.toString() ? `?${params.toString()}` : '';

    api.listListings(query)
      .then((data) => setListings(data.listings))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
      <h1 className="font-display text-3xl text-harbour">Browse listings</h1>

      <div className="mt-6 flex flex-wrap gap-4">
        <Input
          placeholder="City, e.g. Bristol"
          className="max-w-[220px]"
          value={filters.city}
          onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
        />
        <Select
          className="max-w-[180px]"
          value={filters.propertyType}
          onChange={(e) => setFilters((f) => ({ ...f, propertyType: e.target.value }))}
        >
          <option value="">Any property type</option>
          <option value="house">House</option>
          <option value="flat">Flat</option>
          <option value="bungalow">Bungalow</option>
          <option value="studio">Studio</option>
          <option value="land">Land</option>
        </Select>
        <Select
          className="max-w-[160px]"
          value={filters.listingType}
          onChange={(e) => setFilters((f) => ({ ...f, listingType: e.target.value }))}
        >
          <option value="">For sale or rent</option>
          <option value="sale">For sale</option>
          <option value="rent">To let</option>
        </Select>
      </div>

      {loading ? (
        <p className="mt-10 text-slate">Loading listings…</p>
      ) : listings.length === 0 ? (
        <p className="mt-10 text-slate">No listings match those filters yet.</p>
      ) : (
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
