// src/middlewares/authMiddleware.js
const { createClient } = require('@supabase/supabase-js');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Akses ditolak, token tidak ditemukan' });
    }

    // Mengisolasi string token murni dari kata Bearer dan spasi berlebih
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    // PERBAIKAN UTAMA: Suntikkan token user langsung ke dalam headers client Supabase!
    // Ini adalah cara resmi v2 agar server Supabase mengenali hak akses token Anda
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Sekarang fungsi getUser() bisa dipanggil dengan sangat aman dan bersih
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("❌ SUPABASE AUTH ERROR:", error ? error.message : "User tidak ditemukan");
      return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa' });
    }

    // Sukses besar! Simpan data user asli ke dalam request
    req.user = user; 
    next(); 
  } catch (err) {
    console.error("❌ ERROR SATELLITE:", err.message); 
    return res.status(500).json({ error: 'Terjadi kesalahan pada sistem keamanan server' });
  }
};

module.exports = { requireAuth };
