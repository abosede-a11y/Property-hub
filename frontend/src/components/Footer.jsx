import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-harbour-deep text-chalk/80 mt-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 grid gap-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg text-chalk">Property<span className="text-brass"> Hub</span></p>
          <p className="mt-3 text-sm text-chalk/60 max-w-xs">
            Property Hub, 4 Harbour Row, Bristol BS1 4ST
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-chalk mb-3">Explore</p>
          <ul className="space-y-2 text-sm text-chalk/70">
            <li><Link to="/listings" className="hover:text-brass">Browse listings</Link></li>
            <li><Link to="/signup" className="hover:text-brass">Create an account</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-chalk mb-3">Contact</p>
          <ul className="space-y-2 text-sm text-chalk/70">
            <li>hello@propertyhub.example</li>
            <li>0117 496 0958</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-chalk/10 py-5 text-center text-xs text-chalk/50">
        © {new Date().getFullYear()} Property Hub. All rights reserved.
      </div>
    </footer>
  );
}
