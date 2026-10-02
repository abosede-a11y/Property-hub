require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./pool');

async function seed() {
  try {
    const passwordHash = await bcrypt.hash('Demo1234!', 10);

    // Admin
    const admin = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, email_verified)
       VALUES ('Rosa Fielding', 'admin@propertyhub.test', $1, 'admin', TRUE)
       ON CONFLICT (email) DO UPDATE SET role = 'admin', email_verified = TRUE
       RETURNING id`,
      [passwordHash]
    );

    // Verified demo customer
    const customer = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, email_verified, phone, city, postcode, preferred_location, preferred_property_type)
       VALUES ('Nadia Okonjo', 'demo@propertyhub.test', $1, 'customer', TRUE, '07700 900123', 'Bristol', 'BS1 4ST', 'Bristol', 'house')
       ON CONFLICT (email) DO UPDATE SET email_verified = TRUE
       RETURNING id`,
      [passwordHash]
    );

    // Unverified demo customer (to test the verification gate)
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, email_verified)
       VALUES ('Tom Baxter', 'unverified@propertyhub.test', $1, 'customer', FALSE)
       ON CONFLICT (email) DO NOTHING`,
      [passwordHash]
    );

    // Listings
    const listingsData = [
      ['Riverside two-bed apartment', 'A bright, modern two-bedroom apartment overlooking the harbour, with a private balcony and secure parking.', 'flat', 'rent', 1450, 2, 1, '14 Harbourside Walk', 'Bristol', 'BS1 5TY'],
      ['Victorian terrace with garden', 'A well-presented three-bedroom Victorian terrace close to local schools, with a south-facing garden and original period features.', 'house', 'sale', 385000, 3, 1, '27 Elm Grove', 'Bristol', 'BS6 5JA'],
      ['Cosy city-centre studio', 'A compact, well-designed studio flat ideal for professionals, moments from the city centre and transport links.', 'studio', 'rent', 850, 0, 1, '5 Castle Court', 'Bristol', 'BS1 3AG'],
      ['Detached bungalow, quiet cul-de-sac', 'A spacious detached bungalow set in a quiet cul-de-sac, with off-street parking and a low-maintenance garden.', 'bungalow', 'sale', 320000, 2, 1, '9 Orchard Close', 'Bath', 'BA1 6RT'],
    ];

    const listingIds = [];
    for (const row of listingsData) {
      const result = await pool.query(
        `INSERT INTO listings (title, description, property_type, listing_type, price, bedrooms, bathrooms, address_line1, city, postcode)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        row
      );
      if (result.rows.length) listingIds.push(result.rows[0].id);
    }

    // If listings already existed from a prior seed run, fetch their ids so
    // reviews can still be attached.
    let allListingIds = listingIds;
    if (allListingIds.length < listingsData.length) {
      const existing = await pool.query('SELECT id FROM listings ORDER BY created_at ASC LIMIT $1', [listingsData.length]);
      allListingIds = existing.rows.map((r) => r.id);
    }

    if (allListingIds.length >= 2) {
      await pool.query(
        `INSERT INTO reviews (listing_id, user_id, rating, body, status)
         VALUES ($1, $2, 5, 'Fantastic apartment, the agent was really helpful throughout the whole process.', 'approved')
         ON CONFLICT (listing_id, user_id) DO NOTHING`,
        [allListingIds[0], customer.rows[0].id]
      );
    }

    console.log('Seed complete.');
    console.log('  Admin login:    admin@propertyhub.test / Demo1234!');
    console.log('  Customer login: demo@propertyhub.test / Demo1234!');
    console.log('  Unverified:     unverified@propertyhub.test / Demo1234!');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
