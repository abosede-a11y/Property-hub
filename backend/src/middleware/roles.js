const { pool } = require('../db/pool');

async function loadRole(userId) {
  const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.role ?? null;
}

function requireAdmin(req, res, next) {
  loadRole(req.user.id)
    .then((role) => {
      if (role !== 'admin') {
        return res.status(403).json({ error: 'This area is for admins only.' });
      }
      req.user.role = role;
      next();
    })
    .catch((err) => {
      console.error('[roles/requireAdmin]', err);
      res.status(500).json({ error: 'Something went wrong checking your permissions.' });
    });
}

module.exports = { requireAdmin, loadRole };
