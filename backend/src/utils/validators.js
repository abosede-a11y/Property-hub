const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// UK-ish phone: optional +44 / 0, then 9-10 digits, spaces allowed.
const PHONE_RE = /^(\+44\s?|0)(\d[\s]?){9,10}$/;
const POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

function isValidPassword(password) {
  if (typeof password !== 'string' || password.length < 8) return false;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  return hasNumber && hasSpecial;
}

const PASSWORD_HINT = 'Password must be at least 8 characters and include a number and a special character.';

function isValidPhone(phone) {
  if (phone === undefined || phone === null || phone === '') return true; // optional
  return PHONE_RE.test(phone.trim());
}

function isValidPostcode(postcode) {
  if (postcode === undefined || postcode === null || postcode === '') return true; // optional on profile
  return POSTCODE_RE.test(postcode.trim());
}

const PROPERTY_TYPES = ['house', 'flat', 'bungalow', 'studio', 'land'];
const PREFERRED_PROPERTY_TYPES = [...PROPERTY_TYPES, 'no_preference'];

module.exports = {
  isValidEmail,
  isValidPassword,
  PASSWORD_HINT,
  isValidPhone,
  isValidPostcode,
  PROPERTY_TYPES,
  PREFERRED_PROPERTY_TYPES,
};
