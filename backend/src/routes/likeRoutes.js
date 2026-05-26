const express = require('express');
const router = express.Router();
const { toggleLikeMovie } = require('../controllers/likeController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.post('/', requireAuth, toggleLikeMovie); // POST /api/likes

module.exports = router;