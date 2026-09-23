import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <div className="page-container !pt-20 text-center space-y-4">
      <p className="text-6xl font-display font-bold text-primary-200">404</p>
      <h1 className="text-xl font-semibold text-slate-700">Page not found</h1>
      <p className="text-sm text-slate-500">
        The link might be broken or the page may have moved.
      </p>
      <Link to="/" className="btn-primary inline-flex mx-auto">
        Go home
      </Link>
    </div>
  );
}
