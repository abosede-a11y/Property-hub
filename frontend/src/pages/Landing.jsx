import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import ListingCard from '../components/ListingCard';
import { Button, StarRating } from '../components/ui';

export default function Landing() {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    api.listListings().then((data) => setListings(data.listings.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-stone">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-20">
          <div className="max-w-xl">
            <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] text-harbour">
              Find a place that actually fits your life.
            </h1>
            <p className="mt-5 text-base text-slate leading-relaxed max-w-md">
              Search verified listings across the UK, read reviews from people who've actually lived there,
              and get mortgage guidance — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button as={Link} to="/listings" variant="primary">Browse listings →</Button>
              <Button as={Link} to="/signup" variant="secondary">Create a free account</Button>
            </div>
          </div>

          {listings.length > 0 && (
            <div className="mt-14 grid sm:grid-cols-3 gap-5">
              {listings.map((listing, i) => (
                <div
                  key={listing.id}
                  className="animate-[fadeUp_0.5s_ease-out_both]"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <ListingCard listing={listing} featured />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
        <h2 className="font-display text-3xl text-harbour">Three steps, start to keys.</h2>
        <div className="mt-10 grid sm:grid-cols-3 gap-10">
          {[
            { n: '01', title: 'Search', body: "Filter by city, property type and budget to find listings that match what you're after." },
            { n: '02', title: 'Read reviews', body: 'See honest ratings and reviews left by people who have rented, leased or bought through Property Hub.' },
            { n: '03', title: 'Get in touch', body: 'Reach out about a listing, and explore mortgage partners when you’re ready to make it official.' },
          ].map((step) => (
            <div key={step.n}>
              <span className="font-display text-3xl text-brass">{step.n}</span>
              <h3 className="mt-3 font-display text-xl text-harbour">{step.title}</h3>
              <p className="mt-2 text-sm text-slate leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-harbour-deep text-chalk">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 grid sm:grid-cols-2 gap-10 items-center">
          <div>
            <StarRating value={5} size={20} />
            <p className="mt-4 font-display text-2xl leading-snug">
              "Lovely bungalow, would recommend the agency."
            </p>
            <p className="mt-3 text-sm text-chalk/60">Nadia O., renter in Bristol</p>
          </div>
          <div>
            <p className="text-chalk/70 leading-relaxed">
              Every review on Property Hub comes from a signed-in account, and is checked before it goes live —
              so what you read is what other people actually experienced.
            </p>
            <Button as={Link} to="/signup" variant="primary" className="mt-6">Join Property Hub</Button>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
