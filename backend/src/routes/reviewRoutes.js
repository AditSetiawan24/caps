// src/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { createReview, updateReview, deleteReview, testSentiment } = require('../controllers/reviewController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.post('/test-sentiment', testSentiment);            // POST /api/reviews/test-sentiment (Tanpa Auth)
router.post('/', requireAuth, createReview);             // POST /api/reviews (Tambah)
router.put('/:id_review', requireAuth, updateReview);     // PUT /api/reviews/12 (Edit)
router.delete('/:id_review', requireAuth, deleteReview);
module.exports = router;