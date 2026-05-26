const db = require('../config/db');
const { getRecommendationsByTitle } = require('../utils/recommendationHelper');
const { calculateSentimentDistribution } = require('../utils/sentimentHelper');

// 1. Get All Movies + FITUR SEARCH + FITUR FILTER
const getAllMovies = async (req, res) => {
  try {
    const { search, genre, sentimen, year, rating, sort_by, order, page, limit } = req.query;
    
    const activePage = page ? parseInt(page) : 1;
    const activeLimit = limit ? parseInt(limit) : 10;
    const offset = (activePage - 1) * activeLimit;

    let queryText = `SELECT id_film, judul_film, skor_rata_rata, link_poster, genre_utama, tanggal_rilis, popularitas FROM movies WHERE 1=1`;
    let countQueryText = `SELECT COUNT(*) FROM movies WHERE 1=1`;
    
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      const searchCond = ` AND judul_film ILIKE $${paramIndex}`;
      queryText += searchCond; countQueryText += searchCond;
      queryParams.push(`%${search}%`); paramIndex++;
    }
    if (genre) {
      const genreCond = ` AND genre_utama = $${paramIndex}`;
      queryText += genreCond; countQueryText += genreCond;
      queryParams.push(genre); paramIndex++;
    }
    if (sentimen) {
      let sentCond = '';
      if (sentimen.toLowerCase() === 'positif') sentCond = ` AND skor_rata_rata >= 7.0`;
      else if (sentimen.toLowerCase() === 'negatif') sentCond = ` AND skor_rata_rata < 5.0`;
      else if (sentimen.toLowerCase() === 'netral') sentCond = ` AND skor_rata_rata >= 5.0 AND skor_rata_rata < 7.0`;
      queryText += sentCond; countQueryText += sentCond;
    }
    if (year) {
      const yearCond = ` AND EXTRACT(YEAR FROM tanggal_rilis) = $${paramIndex}`;
      queryText += yearCond; countQueryText += yearCond;
      queryParams.push(parseInt(year)); paramIndex++;
    }
    if (rating) {
      const ratingCond = ` AND skor_rata_rata >= $${paramIndex}`;
      queryText += ratingCond; countQueryText += ratingCond;
      queryParams.push(parseFloat(rating)); paramIndex++;
    }

    let allowedSortColumns = { popularity: 'popularitas', release_date: 'tanggal_rilis', rating: 'skor_rata_rata' };
    let sortByColumn = allowedSortColumns[sort_by] || 'popularitas';
    let sortDirection = order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    queryText += ` ORDER BY ${sortByColumn} ${sortDirection}`;

    const totalItemsResult = await db.query(countQueryText, queryParams);
    const totalItems = parseInt(totalItemsResult.rows[0].count);

    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(activeLimit, offset);

    const result = await db.query(queryText, queryParams);
    const totalPages = Math.ceil(totalItems / activeLimit);
    
    res.status(200).json({
      success: true,
      message: 'Films retrieved successfully',
      meta: { current_page: activePage, per_page: activeLimit, total_items: totalItems, total_pages: totalPages },
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Get Movie Detail Berdasarkan ID 
const getMovieById = async (req, res) => {
  let { id_film } = req.params;

  try {
    const idAngka = parseFloat(id_film);
    if (isNaN(idAngka)) {
      return res.status(400).json({ success: false, message: 'Format ID Film tidak valid harus berupa angka' });
    }

    // 1. Tarik Data Film Utama
    const movieResult = await db.query('SELECT * FROM movies WHERE id_film = $1', [idAngka]);
    if (movieResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Film tidak ditemukan' });
    }
    const currentMovie = movieResult.rows[0];

    // 2. Tarik Semua Ulasan Terkait
    const reviewsQuery = `
      SELECT r.id_review, r.ulasan_pengguna, r.kategori_sentimen, u.name 
      FROM reviews r 
      JOIN users u ON r.user_id = u.user_id 
      WHERE r.id_film = $1 
      ORDER BY r.id_review DESC
    `;
    const reviewsResult = await db.query(reviewsQuery, [idAngka]);

    const persentaseSentimen = await calculateSentimentDistribution(idAngka);

    const rekomendasiFilm = await getRecommendationsByTitle(currentMovie.judul_film, idAngka, 5);

    res.status(200).json({
      success: true,
      data: {
        movie: currentMovie,
        reviews: reviewsResult.rows,
        sentimentDistribution: persentaseSentimen,
        recommendations: rekomendasiFilm
      }
    });
  } catch (error) {
    console.error("❌ ERROR GET MOVIE BY ID:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getAllMovies, getMovieById };