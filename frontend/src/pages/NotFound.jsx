import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-5 py-24 text-center">
      <h1 className="font-display text-4xl text-harbour">Page not found</h1>
      <p className="mt-3 text-slate">This address doesn't match any page on Property Hub.</p>
      <Button as={Link} to="/" variant="primary" className="mt-6">Back home</Button>
    </div>
  );
}
