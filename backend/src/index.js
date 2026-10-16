require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const listingsRoutes = require('./routes/listings');
const reviewsRoutes = require('./routes/reviews');
const newsletterRoutes = require('./routes/newsletter');

const app = express();

// Needed so express-rate-limit reads the real client IP from
// X-Forwarded-For correctly when running behind Render's proxy.
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api', limiter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api', reviewsRoutes); // mounts /api/listings/:id/reviews, /api/reviews/*, /api/admin/reviews
app.use('/api', newsletterRoutes); // mounts /api/newsletter/*, /api/admin/newsletter/*

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Something went wrong.' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Property Hub API listening on port ${port}`));
