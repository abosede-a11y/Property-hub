import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-brass' : 'text-harbour/80 hover:text-harbour'}`;

  return (
    <header className="border-b border-stone-dark bg-chalk/95 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-xl tracking-tight text-harbour">
          Property<span className="text-brass"> Hub</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          <NavLink to="/listings" className={linkClass}>Listings</NavLink>
          <NavLink to="/#how-it-works" className={linkClass}>How it works</NavLink>
          {isAuthenticated && <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>}
          {isAuthenticated && user?.role === 'admin' && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="hidden sm:block text-sm font-medium text-harbour/80 hover:text-harbour">
                {user?.fullName?.split(' ')[0] || 'Profile'}
              </Link>
              <Button variant="ghost" onClick={handleLogout}>Sign out</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-harbour/80 hover:text-harbour hidden sm:block">
                Sign in
              </Link>
              <Button as={Link} to="/signup" variant="primary">Get started</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
