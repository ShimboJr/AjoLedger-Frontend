import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { brand } from '../config/brand.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="field-error" role="alert">{message}</p>;
}

export default function Register() {
  usePageTitle('Create account');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/dashboard';

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2)  e.name = 'Name must be at least 2 characters';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate(redirect, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Something went wrong. Please try again.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
  }

  return (
    <div className="page-container !pt-8 !pb-12 max-w-sm">
      <div className="mb-8 text-center space-y-1">
        <h1 className="font-display text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="text-sm text-slate-500">{brand.tagline}</p>
      </div>

      {serverError && (
        <div role="alert" className="mb-4 px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="reg-name" className="label">Full name</label>
          <input
            id="reg-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Amaka Obi"
            value={form.name}
            onChange={handleChange}
            className={`input ${errors.name ? 'border-danger-400 focus:ring-danger-400' : ''}`}
            disabled={submitting}
            aria-describedby={errors.name ? 'reg-name-error' : undefined}
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <label htmlFor="reg-email" className="label">Email address</label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="amaka@example.com"
            value={form.email}
            onChange={handleChange}
            className={`input ${errors.email ? 'border-danger-400 focus:ring-danger-400' : ''}`}
            disabled={submitting}
          />
          <FieldError message={errors.email} />
        </div>

        <div>
          <label htmlFor="reg-password" className="label">Password</label>
          <input
            id="reg-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={handleChange}
            className={`input ${errors.password ? 'border-danger-400 focus:ring-danger-400' : ''}`}
            disabled={submitting}
          />
          <FieldError message={errors.password} />
        </div>

        <button
          id="reg-submit"
          type="submit"
          disabled={submitting}
          className="btn-primary w-full mt-2"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Creating account…
            </span>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-700 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
