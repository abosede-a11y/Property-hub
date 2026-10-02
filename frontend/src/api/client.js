const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong.');
    err.needsVerification = data.needsVerification;
    err.status = res.status;
    throw err;
  }

  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  verifyEmail: (token) => request('/auth/verify-email', { method: 'POST', body: { token } }),
  resendVerification: (email) => request('/auth/resend-verification', { method: 'POST', body: { email } }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  logout: (token) => request('/auth/logout', { method: 'POST', token }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),
  updateProfile: (payload, token) => request('/auth/profile', { method: 'PATCH', body: payload, token }),
  changePassword: (payload, token) => request('/auth/password', { method: 'PATCH', body: payload, token }),

  listListings: (query = '') => request(`/listings${query}`),
  getListing: (id) => request(`/listings/${id}`),

  listReviews: (listingId) => request(`/listings/${listingId}/reviews`),
  createReview: (listingId, payload, token) => request(`/listings/${listingId}/reviews`, { method: 'POST', body: payload, token }),
  myReviews: (token) => request('/reviews/mine', { token }),
  updateReview: (id, payload, token) => request(`/reviews/${id}`, { method: 'PATCH', body: payload, token }),
  deleteReview: (id, token) => request(`/reviews/${id}`, { method: 'DELETE', token }),

  adminListReviews: (status, token) => request(`/admin/reviews?status=${status}`, { token }),
  adminModerateReview: (id, status, token) => request(`/admin/reviews/${id}`, { method: 'PATCH', body: { status }, token }),
};
