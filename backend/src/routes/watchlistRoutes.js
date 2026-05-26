const express = require('express');
const router = express.Router();
const { addToWatchlist, getMyWatchlist, removeFromWatchlist } = require('../controllers/watchlistController');
const { requireAuth } = require('../middlewares/authMiddleware'); // Pastikan nama fungsinya di-import dengan benar sesuai middleware kamu

router.post('/', requireAuth, addToWatchlist); // POST /api/watchlist
router.get('/', requireAuth, getMyWatchlist);  // GET /api/watchlist
router.delete('/:id_film', requireAuth, removeFromWatchlist); // DELETE /api/watchlist/id_film

module.exports = router;