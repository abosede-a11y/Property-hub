import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Field, Input, PhoneInput, Select, PasswordInput, Button, Alert } from '../components/ui';

const PROPERTY_TYPES = [
  { value: '', label: 'No preference' },
  { value: 'house', label: 'House' },
  { value: 'flat', label: 'Flat' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'studio', label: 'Studio' },
  { value: 'land', label: 'Land' },
];

export default function Profile() {
  const { user, token, refreshUser } = useAuth();
  const [form, setForm] = useState(null);
  const [originalEmail, setOriginalEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        addressLine1: user.addressLine1 || '',
        addressLine2: user.addressLine2 || '',
        city: user.city || '',
        postcode: user.postcode || '',
        country: user.country || 'United Kingdom',
        preferredLocation: user.preferredLocation || '',
        preferredPropertyType: user.preferredPropertyType || '',
      });
      setOriginalEmail(user.email || '');
    }
  }, [user]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const emailChanged = form && form.email.trim().toLowerCase() !== originalEmail.toLowerCase();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (emailChanged) payload.currentPassword = currentPassword;
      await api.updateProfile(payload, token);
      await refreshUser();
      setSuccess('Your profile has been updated.');
      setCurrentPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!form) return <div className="max-w-2xl mx-auto px-5 py-16 text-slate">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto px-5 py-16">
      <h1 className="font-display text-3xl text-harbour">Manage profile</h1>
      <p className="mt-2 text-sm text-slate">Update your details and preferences. Changes are saved securely.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && <Alert>{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Full name" htmlFor="fullName">
            <Input id="fullName" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} />
          </Field>
          <Field label="Email address" htmlFor="email" hint={emailChanged ? 'Changing your email requires your current password.' : undefined}>
            <Input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </Field>
        </div>

        {emailChanged && (
          <Field label="Current password" htmlFor="currentPassword" hint="Required to confirm this email change.">
            <PasswordInput id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </Field>
        )}

        <Field label="Phone number" htmlFor="phone">
          <PhoneInput id="phone" value={form.phone} onChange={(v) => update('phone', v)} />
        </Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Address line 1" htmlFor="addressLine1">
            <Input id="addressLine1" value={form.addressLine1} onChange={(e) => update('addressLine1', e.target.value)} />
          </Field>
          <Field label="Address line 2" htmlFor="addressLine2">
            <Input id="addressLine2" value={form.addressLine2} onChange={(e) => update('addressLine2', e.target.value)} />
          </Field>
          <Field label="City" htmlFor="city">
            <Input id="city" value={form.city} onChange={(e) => update('city', e.target.value)} />
          </Field>
          <Field label="Postcode" htmlFor="postcode">
            <Input id="postcode" value={form.postcode} onChange={(e) => update('postcode', e.target.value.toUpperCase())} />
          </Field>
        </div>

        <div className="pt-2 border-t border-stone-dark" />

        <p className="text-sm font-semibold text-harbour">Property preferences</p>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Preferred location" htmlFor="preferredLocation" hint="A city or area you're interested in">
            <Input id="preferredLocation" value={form.preferredLocation} onChange={(e) => update('preferredLocation', e.target.value)} />
          </Field>
          <Field label="Preferred property type" htmlFor="preferredPropertyType">
            <Select id="preferredPropertyType" value={form.preferredPropertyType} onChange={(e) => update('preferredPropertyType', e.target.value)}>
              {PROPERTY_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save changes'}
        </Button>
      </form>

      <PasswordSection token={token} />
    </div>
  );
}

function PasswordSection({ token }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.changePassword({ currentPassword, newPassword }, token);
      setSuccess('Your password has been updated.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-14 pt-10 border-t border-stone-dark">
      <p className="text-sm font-semibold text-harbour">Change password</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-5 max-w-sm">
        {error && <Alert>{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}
        <Field label="Current password" htmlFor="currentPassword2">
          <PasswordInput id="currentPassword2" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </Field>
        <Field label="New password" htmlFor="newPassword" hint="At least 8 characters, with a number and a special character.">
          <PasswordInput id="newPassword" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </Field>
        <Button type="submit" variant="secondary" disabled={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </div>
  );
}
