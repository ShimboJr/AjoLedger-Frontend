import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * ProfilePage — temporary stub that redirects to /trust.
 * The Trust page is the primary self-service page for now.
 * A full profile page (settings, avatar, notifications) is deferred to Day 6+.
 */
export default function ProfilePage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/trust', { replace: true });
  }, [navigate]);

  return null;
}
