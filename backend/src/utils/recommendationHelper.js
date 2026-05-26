const db = require('../config/db');
const axios = require('axios');
require('dotenv').config();

const aiClient = axios.create({
  baseURL: process.env.AI_ENGINEER_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000 
});

/**
 * Mengambil rekomendasi film serupa berdasarkan model Machine Learning (Content-Based Filtering)
 * @param {string} title 
 * @param {number} idFilmSekarang 
 * @param {number} limit 
 */
const getRecommendationsByTitle = async (title, idFilmSekarang, limit = 5) => {
  try {
    const response = await aiClient.post('/recommend', { 
      title: title,
      top_n: limit 
    });

    const recommendedIds = response.data.recommendations || [];

    if (recommendedIds.length === 0) {
      return [];
    }

    // Ambil detail film dari database berdasarkan ID yang direkomendasikan AI
    const placeholders = recommendedIds.map((_, i) => `$${i + 1}`).join(',');
    const recommendationQuery = `
      SELECT id_film AS id, judul_film AS title, link_poster AS poster_url, skor_rata_rata AS rating, genre_utama AS genres 
      FROM movies 
      WHERE id_film IN (${placeholders})
    `;
    const result = await db.query(recommendationQuery, recommendedIds);

    // Filter agar film yang sedang dilihat tidak muncul (jaga-jaga jika AI mengembalikannya)
    return result.rows.filter(movie => movie.id != idFilmSekarang);
  } catch (error) {
    console.error("❌ Error di Recommendation Helper:", error.message);
    // Fallback: Jika FastAPI mati, kembalikan array kosong atau query SQL sederhana
    return [];
  }
};

module.exports = { getRecommendationsByTitle };