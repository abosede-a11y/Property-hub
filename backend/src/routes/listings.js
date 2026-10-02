const express = require('express');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { PROPERTY_TYPES } = require('../utils/validators');

const router = express.Router();

function publicListing(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    propertyType: row.property_type,
    listingType: row.listing_type,
    price: Number(row.price),
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    addressLine1: row.address_line1,
    city: row.city,
    postcode: row.postcode,
    status: row.status,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    avgRating: row.avg_rating !== undefined ? (row.avg_rating ? Number(row.avg_rating) : null) : undefined,
    reviewCount: row.review_count !== undefined ? Number(row.review_count) : undefined,
  };
}

// GET /api/listings - browse, with optional filters
router.get('/', async (req, res) => {
  const { city, propertyType, listingType, minBedrooms } = req.query;
  const clauses = [];
  const params = [];

  if (city) {
    params.push(`%${city}%`);
    clauses.push(`l.city ILIKE $${params.length}`);
  }
  if (propertyType && PROPERTY_TYPES.includes(propertyType)) {
    params.push(propertyType);
    clauses.push(`l.property_type = $${params.length}`);
  }
  if (listingType && ['sale', 'rent'].includes(listingType)) {
    params.push(listingType);
    clauses.push(`l.listing_type = $${params.length}`);
  }
  if (minBedrooms) {
    params.push(Number(minBedrooms));
    clauses.push(`l.bedrooms >= $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT l.*,
              AVG(r.rating) FILTER (WHERE r.status = 'approved') AS avg_rating,
              COUNT(r.id) FILTER (WHERE r.status = 'approved') AS review_count
       FROM listings l
       LEFT JOIN reviews r ON r.listing_id = l.id
       ${where}
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
      params
    );
    res.json({ listings: result.rows.map(publicListing) });
  } catch (err) {
    console.error('[listings/list]', err);
    res.status(500).json({ error: 'Something went wrong loading listings.' });
  }
});

// GET /api/listings/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*,
              AVG(r.rating) FILTER (WHERE r.status = 'approved') AS avg_rating,
              COUNT(r.id) FILTER (WHERE r.status = 'approved') AS review_count
       FROM listings l
       LEFT JOIN reviews r ON r.listing_id = l.id
       WHERE l.id = $1
       GROUP BY l.id`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Listing not found.' });
    res.json({ listing: publicListing(result.rows[0]) });
  } catch (err) {
    console.error('[listings/get]', err);
    res.status(500).json({ error: 'Something went wrong loading that listing.' });
  }
});

// --- Admin: manage listings ---

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { title, description, propertyType, listingType, price, bedrooms, bathrooms, addressLine1, city, postcode, imageUrl } = req.body || {};

  if (!title || !description || !PROPERTY_TYPES.includes(propertyType) || !['sale', 'rent'].includes(listingType) || !price || !addressLine1 || !city || !postcode) {
    return res.status(400).json({ error: 'Fill in all required listing fields.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO listings (title, description, property_type, listing_type, price, bedrooms, bathrooms, address_line1, city, postcode, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [title, description, propertyType, listingType, price, bedrooms || null, bathrooms || null, addressLine1, city, postcode, imageUrl || null]
    );
    res.status(201).json({ listing: publicListing(result.rows[0]) });
  } catch (err) {
    console.error('[listings/create]', err);
    res.status(500).json({ error: 'Something went wrong creating the listing.' });
  }
});

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { title, description, propertyType, listingType, price, bedrooms, bathrooms, addressLine1, city, postcode, status, imageUrl } = req.body || {};

  try {
    const existing = await pool.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Listing not found.' });
    const current = existing.rows[0];

    const result = await pool.query(
      `UPDATE listings SET title=$1, description=$2, property_type=$3, listing_type=$4, price=$5,
       bedrooms=$6, bathrooms=$7, address_line1=$8, city=$9, postcode=$10, status=$11, image_url=$12
       WHERE id=$13 RETURNING *`,
      [
        title || current.title,
        description || current.description,
        propertyType || current.property_type,
        listingType || current.listing_type,
        price || current.price,
        bedrooms !== undefined ? bedrooms : current.bedrooms,
        bathrooms !== undefined ? bathrooms : current.bathrooms,
        addressLine1 || current.address_line1,
        city || current.city,
        postcode || current.postcode,
        status || current.status,
        imageUrl !== undefined ? imageUrl : current.image_url,
        current.id,
      ]
    );
    res.json({ listing: publicListing(result.rows[0]) });
  } catch (err) {
    console.error('[listings/update]', err);
    res.status(500).json({ error: 'Something went wrong updating the listing.' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM listings WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[listings/delete]', err);
    res.status(500).json({ error: 'Something went wrong deleting the listing.' });
  }
});

module.exports = router;
