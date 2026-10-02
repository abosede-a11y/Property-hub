const express = require('express');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

const router = express.Router();

function publicReview(row) {
  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing_title,
    userId: row.user_id,
    reviewerName: row.reviewer_name,
    rating: row.rating,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
  };
}

// GET /api/listings/:listingId/reviews - approved reviews for a listing (public)
router.get('/listings/:listingId/reviews', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.full_name AS reviewer_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.listing_id = $1 AND r.status = 'approved'
       ORDER BY r.created_at DESC`,
      [req.params.listingId]
    );
    res.json({ reviews: result.rows.map(publicReview) });
  } catch (err) {
    console.error('[reviews/list]', err);
    res.status(500).json({ error: 'Something went wrong loading reviews.' });
  }
});

// POST /api/listings/:listingId/reviews - leave a review (requires sign-in)
router.post('/listings/:listingId/reviews', requireAuth, async (req, res) => {
  const { rating, body } = req.body || {};
  const ratingNum = Number(rating);

  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Choose a rating between 1 and 5.' });
  }
  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'Write a few words about your experience.' });
  }

  try {
    const listing = await pool.query('SELECT id FROM listings WHERE id = $1', [req.params.listingId]);
    if (!listing.rows.length) return res.status(404).json({ error: 'Listing not found.' });

    const existing = await pool.query(
      'SELECT id FROM reviews WHERE listing_id = $1 AND user_id = $2',
      [req.params.listingId, req.user.id]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'You have already reviewed this property. You can edit your existing review instead.' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (listing_id, user_id, rating, body)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.listingId, req.user.id, ratingNum, body.trim()]
    );

    res.status(201).json({
      ok: true,
      message: 'Thanks for your review. It will appear on the listing once approved.',
      review: publicReview({ ...result.rows[0], reviewer_name: null }),
    });
  } catch (err) {
    console.error('[reviews/create]', err);
    res.status(500).json({ error: 'Something went wrong submitting your review.' });
  }
});

// GET /api/reviews/mine - the signed-in user's own reviews, any status
router.get('/reviews/mine', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, l.title AS listing_title
       FROM reviews r
       JOIN listings l ON l.id = r.listing_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json({ reviews: result.rows.map(publicReview) });
  } catch (err) {
    console.error('[reviews/mine]', err);
    res.status(500).json({ error: 'Something went wrong loading your reviews.' });
  }
});

// PATCH /api/reviews/:id - edit own review (only while still pending)
router.patch('/reviews/:id', requireAuth, async (req, res) => {
  const { rating, body } = req.body || {};

  try {
    const existing = await pool.query('SELECT * FROM reviews WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Review not found.' });
    const review = existing.rows[0];

    if (review.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own reviews.' });
    }
    if (review.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending reviews can be edited.' });
    }

    const ratingNum = rating !== undefined ? Number(rating) : review.rating;
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Choose a rating between 1 and 5.' });
    }

    const result = await pool.query(
      'UPDATE reviews SET rating = $1, body = $2 WHERE id = $3 RETURNING *',
      [ratingNum, (body !== undefined ? body.trim() : review.body), review.id]
    );
    res.json({ review: publicReview({ ...result.rows[0], reviewer_name: null }) });
  } catch (err) {
    console.error('[reviews/update]', err);
    res.status(500).json({ error: 'Something went wrong updating your review.' });
  }
});

// DELETE /api/reviews/:id - remove own review at any time
router.delete('/reviews/:id', requireAuth, async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM reviews WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Review not found.' });
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own reviews.' });
    }
    await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[reviews/delete]', err);
    res.status(500).json({ error: 'Something went wrong deleting your review.' });
  }
});

// --- Admin moderation ---

// GET /api/admin/reviews?status=pending
router.get('/admin/reviews', requireAuth, requireAdmin, async (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'pending';
  try {
    const result = await pool.query(
      `SELECT r.*, u.full_name AS reviewer_name, l.title AS listing_title
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN listings l ON l.id = r.listing_id
       WHERE r.status = $1
       ORDER BY r.created_at ASC`,
      [status]
    );
    res.json({ reviews: result.rows.map(publicReview) });
  } catch (err) {
    console.error('[admin/reviews/list]', err);
    res.status(500).json({ error: 'Something went wrong loading reviews.' });
  }
});

// PATCH /api/admin/reviews/:id - approve or reject
router.patch('/admin/reviews/:id', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected.' });
  }
  try {
    const result = await pool.query(
      `UPDATE reviews SET status = $1, moderated_at = now() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Review not found.' });
    res.json({ review: publicReview({ ...result.rows[0], reviewer_name: null }) });
  } catch (err) {
    console.error('[admin/reviews/moderate]', err);
    res.status(500).json({ error: 'Something went wrong updating that review.' });
  }
});

module.exports = router;
