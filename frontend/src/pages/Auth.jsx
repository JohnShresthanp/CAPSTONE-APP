import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chrome } from 'lucide-react';
import AuthForm from '../components/AuthForm';
import GenreSelector from '../components/GenreSelector';
import { loginUser, registerUser, fetchOAuthUrls } from '../services/authApi';
import { updateGenrePreferences } from '../services/userApi';

function Auth() {
  const navigate = useNavigate();
  const initialMode = window.location.pathname.includes('register') ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [genreSaving, setGenreSaving] = useState(false);
  const [oauthUrls, setOauthUrls] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    if (token) {
      localStorage.setItem('filmMosaicToken', token);
      if (refreshToken) localStorage.setItem('filmMosaicRefreshToken', refreshToken);
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    fetchOAuthUrls().then(setOauthUrls).catch(() => {});
  }, []);

  const modes = {
    login: {
      title: 'Welcome back',
      submitLabel: 'Login',
      fields: [
        { name: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com' },
        { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter your password' }
      ]
    },
    register: {
      title: 'Create your profile',
      submitLabel: 'Register',
      fields: [
        { name: 'username', label: 'Username', type: 'text', placeholder: 'Filmfan123' },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com' },
        { name: 'password', label: 'Password', type: 'password', placeholder: 'Create a password' },
        { name: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Repeat your password' }
      ]
    }
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setStep('form');
    setError('');
    navigate(nextMode === 'register' ? '/register' : '/login', { replace: true });
  };

  const handleSubmit = async (formValues) => {
    setError('');
    setFieldErrors([]);
    setLoading(true);

    try {
      const response = mode === 'login' ? await loginUser(formValues) : await registerUser(formValues);
      localStorage.setItem('filmMosaicToken', response.token);
      localStorage.setItem('filmMosaicRefreshToken', response.refreshToken);

      if (mode === 'register') {
        setStep('genres');
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        setFieldErrors(data.errors);
        setError('');
      } else {
        setError(data?.message || 'An error occurred.');
        setFieldErrors([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenreDone = async () => {
    if (selectedGenres.length < 5) return;
    setGenreSaving(true);
    try {
      await updateGenrePreferences(selectedGenres);
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      window.location.href = '/';
    }
  };

  const current = modes[mode];

  return (
    <div className="min-h-screen bg-surface text-text flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-[420px] space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="text-sm text-muted">
            {mode === 'login' ? "Welcome back to FilmMosaic" : "Join the film community"}
          </p>
        </div>

        {step === 'genres' ? (
          <div className="rounded-[32px] border border-white/10 bg-surface2 p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">Pick your favorite genres</h2>
              <p className="text-sm text-muted">Select at least 5 to get personalized recommendations.</p>
            </div>
            <GenreSelector selected={selectedGenres} onChange={setSelectedGenres} min={5} />
            <button
              onClick={handleGenreDone}
              disabled={selectedGenres.length < 5 || genreSaving}
              className="w-full rounded-full bg-accentGold px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {genreSaving ? 'Saving...' : `Get Started (${selectedGenres.length}/5)`}
            </button>
          </div>
        ) : (
          <>
            <AuthForm
              title={current.title}
              submitLabel={current.submitLabel}
              fields={current.fields}
              onSubmit={handleSubmit}
              error={error}
              fieldErrors={fieldErrors}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-2 text-muted">or continue with</span>
              </div>
            </div>

            <div className="grid gap-3">
              {oauthUrls.google && (
                <a
                  href={oauthUrls.google}
                  className="flex items-center justify-center gap-3 rounded-full border border-white/10 bg-surface3 px-4 py-3 text-sm text-text transition hover:border-white/20"
                >
                  <Chrome size={18} />
                  Google
                </a>
              )}
              {oauthUrls.github && (
                <a
                  href={oauthUrls.github}
                  className="flex items-center justify-center gap-3 rounded-full border border-white/10 bg-surface3 px-4 py-3 text-sm text-text transition hover:border-white/20"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              )}
            </div>

            <p className="text-center text-xs text-muted">
              {mode === 'login' ? (
                <>Don&apos;t have an account?{' '}<button type="button" onClick={() => handleModeChange('register')} className="text-accentGold hover:underline font-medium">Register</button></>
              ) : (
                <>Already have an account?{' '}<button type="button" onClick={() => handleModeChange('login')} className="text-accentGold hover:underline font-medium">Sign in</button></>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Auth;
