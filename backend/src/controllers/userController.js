// src/controllers/userController.js
const db = require('../config/db');

const checkAndSyncProfile = async (req, res) => {
  try {
    const supabaseUser = req.user; 
    
    // Cek apakah user sudah ada di tabel public.users
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [supabaseUser.email]);
    let userProfile = userResult.rows[0];

    // Jika belum ada, buat profil baru (Menggunakan koneksi Super Admin untuk memotong RLS)
    if (!userProfile) {
      // Hitung total user untuk generate user_id (misal: USR5)
      const countResult = await db.query('SELECT COUNT(*) FROM users');
      const count = parseInt(countResult.rows[0].count, 10) || 0;
      const nextCustomId = `USR${count + 1}`; 

      const name = supabaseUser.user_metadata?.full_name || 'User Baru';
      const email = supabaseUser.email;

      // Sisipkan data dan langsung kembalikan data barunya (RETURNING *)
      const insertResult = await db.query(
        `INSERT INTO users (user_id, name, email) VALUES ($1, $2, $3) RETURNING *`,
        [nextCustomId, name, email]
      );
      
      userProfile = insertResult.rows[0];
    }

    return res.json(userProfile);
  } catch (err) {
    console.error("Gagal sinkronisasi profil:", err);
    return res.status(500).json({ error: 'Terjadi kesalahan server internal saat memproses profil' });
  }
};

module.exports = { checkAndSyncProfile };
