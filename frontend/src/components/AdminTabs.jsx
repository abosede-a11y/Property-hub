import { NavLink } from 'react-router-dom';

export default function AdminTabs() {
  const tabClass = ({ isActive }) =>
    `px-3 py-1.5 text-sm font-medium rounded-[3px] transition-colors ${
      isActive ? 'bg-harbour text-chalk' : 'text-harbour/70 hover:bg-stone'
    }`;

  return (
    <nav className="flex items-center gap-2 mb-10">
      <NavLink to="/admin" end className={tabClass}>Reviews</NavLink>
      <NavLink to="/admin/newsletter" className={tabClass}>Newsletter</NavLink>
    </nav>
  );
}
