import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

function AuthForm({ title, submitLabel, fields, onSubmit, error, fieldErrors }) {
  const [formValues, setFormValues] = useState(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
  );
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formValues);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(({ name, label, type, placeholder }) => (
        <div key={name}>
          <label className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-muted" htmlFor={name}>
            {label}
          </label>
          <div className="relative">
            <input
              id={name}
              name={name}
              type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
              value={formValues[name]}
              onChange={(event) => handleChange(name, event.target.value)}
              placeholder={placeholder}
              required
              className="w-full rounded-2xl border border-white/10 bg-surface3/50 px-4 py-3 text-sm text-text outline-none transition focus:border-white/20 focus:bg-surface3"
            />
            {type === 'password' && formValues[name] && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
          {fieldErrors?.filter((fe) => fe.field === name).map((fe) => (
            <p key={fe.field} className="mt-1 text-xs text-red-400">{fe.message}</p>
          ))}
        </div>
      ))}

      {error && (
        <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {fieldErrors?.length > 0 && !error && (
        <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <ul className="list-disc pl-4 space-y-1">
            {fieldErrors.map((fe, i) => (
              <li key={i}>{fe.message}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="submit"
        className="w-full rounded-2xl bg-accentGold px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-surface transition hover:bg-yellow-400"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export default AuthForm;
