const db = require('../config/db');
const { analyzeSentiment } = require('../utils/aiClient');

const testSentiment = async (req, res) => {
  const { ulasan_pengguna } = req.body;
  if (!ulasan_pengguna || ulasan_pengguna.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Ulasan terlalu pendek! Minimal harus 3 karakter.' });
  }
  try {
    const kategori_sentimen = await analyzeSentiment(ulasan_pengguna);
    res.status(200).json({ success: true, data: { kategori_sentimen } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// const createReview = async (req, res) => {
//   const { id_film, ulasan_pengguna, rating_pengguna } = req.body;
//   const user_id = req.user.id; // Didapatkan dari JWT token via authMiddleware nanti

//   console.log("User ID yang didapat dari token Google:", user_id);

//   if (!id_film || !ulasan_pengguna) {
//     return res.status(400).json({ success: false, message: 'Data film dan ulasan wajib diisi' });
//   }

//   try {
//     // 1. Panggil helper AI untuk mendeteksi sentimen teks ulasan secara otomatis
//     const kategori_sentimen = await analyzeSentiment(ulasan_pengguna);

//     // 2. Simpan ulasan ke dalam tabel reviews
//     // Nilai ulasan_bersih disamakan dulu atau kosongkan jika tim AI punya preprocessing sendiri
//     await db.query(
//       `INSERT INTO reviews (user_id, id_film, ulasan_pengguna, ulasan_bersih, kategori_sentimen) 
//        VALUES ($1, $2, $3, $4, $5)`,
//       [user_id, id_film, ulasan_pengguna, ulasan_pengguna, kategori_sentimen]
//     );

//     // 3. Simpan juga ratingnya ke tabel ratings
//     if (rating_pengguna) {
//       await db.query(
//         `INSERT INTO ratings (user_id, id_film, rating_pengguna) VALUES ($1, $2, $3)`,
//         [user_id, id_film, rating_pengguna]
//       );
//     }

//     res.status(201).json({
//       success: true,
//       message: 'Ulasan berhasil dikirim dan dianalisis oleh AI!',
//       data: { kategori_sentimen }
//     });
//   } catch (error) {
//     console.error("❌ GAGAL INSERT REVIEW:", error.message); // Biar keliatan error-nya apa di console terminal
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// A. TAMBAH REVIEW (Dengan Validasi Karakter Ketat)
const createReview = async (req, res) => {
  const { id_film, ulasan_pengguna, rating_pengguna } = req.body;
  const supabaseUser = req.user; 
  const idAngka = parseFloat(id_film);

  // 1. Validasi Keberadaan Data
  if (!id_film || !ulasan_pengguna) {
    return res.status(400).json({ success: false, message: 'Data film dan ulasan wajib diisi' });
  }

  // 2. VALIDASI KARAKTER (Biar Sinkron dengan Helper AI)
  const ulasanBersih = ulasan_pengguna.trim();
  if (ulasanBersih.length < 3) {
    return res.status(400).json({ success: false, message: 'Ulasan terlalu pendek! Minimal harus 3 karakter.' });
  }
  if (ulasanBersih.length > 1000) {
    return res.status(400).json({ success: false, message: 'Ulasan terlalu panjang! Maksimal 1000 karakter.' });
  }

  try {
    // Cari internal user_id
    const userResult = await db.query('SELECT user_id FROM users WHERE email = $1', [supabaseUser.email]);
    if (userResult.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Harap login ulang / sinkronisasi profil terlebih dahulu' });
    }
    const internal_user_id = userResult.rows[0].user_id;

    // 3. Validasi Duplikasi: 1 User hanya boleh 1 review per film
    const checkReview = await db.query(
      'SELECT id_review FROM reviews WHERE user_id = $1 AND id_film = $2',
      [internal_user_id, idAngka]
    );

    if (checkReview.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kamu sudah pernah memberikan ulasan pada film ini! Silakan gunakan fitur edit jika ingin mengubah.' 
      });
    }

    // 4. Panggil helper AI untuk mendeteksi sentimen teks ulasan
    const kategori_sentimen = await analyzeSentiment(ulasanBersih);

    // 5. Simpan ulasan ke dalam tabel reviews
    await db.query(
      `INSERT INTO reviews (user_id, id_film, ulasan_pengguna, ulasan_bersih, kategori_sentimen) 
       VALUES ($1, $2, $3, $4, $5)`,
      [internal_user_id, idAngka, ulasanBersih, ulasanBersih, kategori_sentimen]
    );

    // 6. Simpan juga ratingnya ke tabel ratings
    if (rating_pengguna) {
      await db.query(
        `INSERT INTO ratings (user_id, id_film, rating_pengguna) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (user_id, id_film) DO UPDATE SET rating_pengguna = EXCLUDED.rating_pengguna`,
        [internal_user_id, idAngka, rating_pengguna]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Ulasan berhasil dikirim dan dianalisis oleh AI!',
      data: { kategori_sentimen }
    });
  } catch (error) {
    console.error("❌ GAGAL INSERT REVIEW:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// B. EDIT REVIEW (Dengan Validasi Karakter Ketat)
const updateReview = async (req, res) => {
  const { id_review } = req.params;
  const { ulasan_pengguna, rating_pengguna } = req.body;
  const user_id = req.user.id;

  if (!ulasan_pengguna) {
    return res.status(400).json({ success: false, message: 'Ulasan baru wajib diisi' });
  }

  // VALIDASI KARAKTER PADA EDIT REVIEW
  const ulasanBersih = ulasan_pengguna.trim();
  if (ulasanBersih.length < 3) {
    return res.status(400).json({ success: false, message: 'Ulasan baru terlalu pendek! Minimal harus 3 karakter.' });
  }
  if (ulasanBersih.length > 1000) {
    return res.status(400).json({ success: false, message: 'Ulasan baru terlalu panjang! Maksimal 1000 karakter.' });
  }

  try {
    const reviewCheck = await db.query(
      'SELECT id_film FROM reviews WHERE id_review = $1 AND user_id = $2',
      [id_review, user_id]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Ulasan tidak ditemukan atau kamu tidak berhak mengubah ulasan ini' });
    }

    const id_film = reviewCheck.rows[0].id_film;

    // Analisis ulang sentimen dari ulasan yang baru diedit
    const kategori_sentimen = await analyzeSentiment(ulasanBersih);

    // Update tabel reviews
    await db.query(
      `UPDATE reviews 
       SET ulasan_pengguna = $1, ulasan_bersih = $2, kategori_sentimen = $3 
       WHERE id_review = $4 AND user_id = $5`,
      [ulasanBersih, ulasanBersih, kategori_sentimen, id_review, user_id]
    );

    if (rating_pengguna) {
      await db.query(
        `INSERT INTO ratings (user_id, id_film, rating_pengguna) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (user_id, id_film) DO UPDATE SET rating_pengguna = EXCLUDED.rating_pengguna`,
        [user_id, id_film, rating_pengguna]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Ulasan berhasil diperbarui dan dianalisis ulang oleh AI!',
      data: { kategori_sentimen }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// C. HAPUS REVIEW
const deleteReview = async (req, res) => {
  const { id_review } = req.params;
  const user_id = req.user.id;

  try {
    const reviewCheck = await db.query(
      'SELECT id_film FROM reviews WHERE id_review = $1 AND user_id = $2',
      [id_review, user_id]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Ulasan tidak ditemukan atau kamu tidak berhak menghapus ulasan ini' });
    }

    const id_film = reviewCheck.rows[0].id_film;

    await db.query('DELETE FROM reviews WHERE id_review = $1 AND user_id = $2', [id_review, user_id]);
    await db.query('DELETE FROM ratings WHERE user_id = $1 AND id_film = $2', [user_id, id_film]);

    res.status(200).json({ success: true, message: 'Ulasan dan rating berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { createReview, updateReview, deleteReview, testSentiment };