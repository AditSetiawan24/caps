const axios = require('axios');
require('dotenv').config();

// 1. Inisialisasi Axios Instance dengan Base URL dari API FastAPI milik Tim AI
const aiClient = axios.create({
  baseURL: process.env.AI_ENGINEER_API_URL || 'http://localhost:8000', // fallback ke localhost jika .env belum di-set
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000 // Batas waktu tunggu maksimal 5 detik agar server Express kamu tidak nge-hang
});
/**
 * Fungsi untuk mengirim teks ulasan ke API AI FastAPI
 * @param {string} text - Teks ulasan mentah dari frontend
 * @returns {Promise<string>} - Properti label sentimen ('Positif', 'Negatif', atau 'Netral')
 */
const analyzeSentiment = async (text) => {
  // 2. Validasi awal di tingkat utilitas (Defense Programming)
  if (!text || typeof text !== 'string') {
    console.log('⚠️ Input ulasan tidak valid atau kosong, menggunakan sentimen default: Netral');
    return 'Netral';
  }

  const ulasanBersih = text.trim();

  try {
    // 3. Kirim data ke endpoint '/predict-sentiment' milik FastAPI
    const response = await aiClient.post('/predict-sentiment', { review_text: ulasanBersih });
    
    // Pastikan format response sesuai kesepakatan tim AI (misal mengembalikan properti 'sentiment')
    if (response.data && response.data.sentiment) {
      return response.data.sentiment; 
    }

    console.log('⚠️ Format response API AI tidak sesuai, menggunakan sentimen default: Netral');
    return 'Netral';

  } catch (error) {
    // 4. Fallback Strategy jika API AI mati atau eror saat meet/demo
    let errorMessage = error.message;
    if (error.response) {
      errorMessage = `Server AI merespon dengan status ${error.response.status}`;
    } else if (error.request) {
      errorMessage = 'Tidak ada respon dari server AI (Server mati atau URL salah)';
    }

    console.error(`⚠️ Gagal terhubung ke API AI (${errorMessage}), menggunakan sentimen default (Netral)`);
    return 'Netral'; // Tetap kembalikan Netral agar proses simpan ulasan di database tidak gagal
  }
};

module.exports = { analyzeSentiment };