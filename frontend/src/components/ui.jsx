import { useState } from 'react';

export function Button({ variant = 'primary', className = '', as: As = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-[3px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-brass text-harbour-deep hover:bg-brass-deep',
    dark: 'bg-harbour text-chalk hover:bg-harbour-deep',
    secondary: 'bg-transparent border border-harbour text-harbour hover:bg-harbour hover:text-chalk',
    ghost: 'bg-transparent text-harbour hover:bg-stone',
    danger: 'bg-transparent border border-rust text-rust hover:bg-rust hover:text-chalk',
  };
  return <As className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-harbour">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-slate">{hint}</p>}
      {error && <p className="text-xs text-rust">{error}</p>}
    </div>
  );
}

const inputBase = 'w-full rounded-[3px] border border-stone-dark bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate/60 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass';

export function Input(props) {
  return <input className={inputBase} {...props} />;
}

export function Textarea(props) {
  return <textarea className={`${inputBase} min-h-[110px] resize-y`} {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className={inputBase} {...props}>
      {children}
    </select>
  );
}

export function PasswordInput({ id, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={visible ? 'text' : 'password'} className={`${inputBase} pr-11`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate hover:text-harbour"
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  );
}

export function formatPhoneInput(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.startsWith('07')) {
    // UK mobile: 07700 900123
    return digits.replace(/(\d{5})(\d{0,6})/, (_, a, b) => (b ? `${a} ${b}` : a));
  }
  if (digits.startsWith('020')) {
    // London landline: 020 7946 0958
    return digits.replace(/(\d{3})(\d{0,4})(\d{0,4})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '));
  }
  if (digits.startsWith('0')) {
    // Other UK landline: 01234 567890
    return digits.replace(/(\d{5})(\d{0,6})/, (_, a, b) => (b ? `${a} ${b}` : a));
  }
  return digits;
}

export function PhoneInput({ value, onChange, ...props }) {
  return (
    <Input
      inputMode="tel"
      placeholder="07700 900123"
      value={value}
      onChange={(e) => onChange(formatPhoneInput(e.target.value))}
      {...props}
    />
  );
}

export function Alert({ tone = 'error', children }) {
  const tones = {
    error: 'bg-rust-light text-rust border-rust/30',
    success: 'bg-hedge-light text-hedge border-hedge/30',
    info: 'bg-stone text-harbour border-stone-dark',
  };
  return <div className={`rounded-[3px] border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}

export function StarRating({ value, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 20 20" fill={n <= Math.round(value) ? '#A9793B' : '#DED4C0'}>
          <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9L10 14.9l-5.2 2.9 1-5.9L1.5 7.7l5.9-.8L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`Rate ${n} out of 5`}
          className="p-0.5"
        >
          <svg width={26} height={26} viewBox="0 0 20 20" fill={n <= value ? '#A9793B' : '#DED4C0'}>
            <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9L10 14.9l-5.2 2.9 1-5.9L1.5 7.7l5.9-.8L10 1.5z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconEyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.9 10.9 0 0 1 12 20c-7 0-11-7-11-7a20.3 20.3 0 0 1 4.22-5.06M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 7 11 7a20.3 20.3 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

export function IconBed() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 18v-6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6M2 18v3M22 18v3M2 12V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

export function IconBath() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12h16a1 1 0 0 1 1 1 6 6 0 0 1-4 5.66V20a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-1.34A6 6 0 0 1 3 13a1 1 0 0 1 1-1zM6 12V6a2 2 0 0 1 3-1.73" />
    </svg>
  );
}

export function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
