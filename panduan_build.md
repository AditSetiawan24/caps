# Panduan Build (Developer Handoff)

Dokumen ini berisi panduan dan aturan krusial bagi setiap divisi (Frontend, Backend, AI/FastAPI, dan Data Science) jika ingin melakukan perubahan, *rebuild*, atau pengembangan fitur lebih lanjut pada proyek ini.

---

## Gambaran Besar Arsitektur
Sistem ini menggunakan arsitektur *Microservices*, di mana beban kerja dibagi ke dalam 4 komponen utama yang saling berinteraksi:

1. **Frontend (Antarmuka Pengguna):** Dibangun dengan **Next.js** (berjalan di port `3000`). Komponen ini bertanggung jawab penuh atas interaksi visual dengan pengguna, seperti menampilkan halaman utama, *form* pencarian, dan tombol *login*. Frontend tidak menyimpan data secara mandiri; seluruh interaksi data dilakukan melalui permintaan HTTP (API) ke Backend.
2. **Backend (API Utama & Logika Bisnis):** Dibangun dengan **Node.js/Express** (berjalan di port `5000`). Ini adalah pusat pengendali sistem yang mendistribusikan *request* dari Frontend:
   - Jika *request* membutuhkan data operasional (seperti detail film atau ulasan), Backend akan melakukan operasi CRUD ke Database.
   - Jika *request* membutuhkan komputasi spesifik (seperti sistem rekomendasi atau klasifikasi teks), Backend akan meneruskannya ke layanan AI.
3. **Database (Penyimpanan Data Terpusat):** Menggunakan **Supabase PostgreSQL**. Komponen ini menyimpan seluruh data esensial aplikasi (tabel film, akun pengguna, dan riwayat *review*). Untuk alasan keamanan, transaksi langsung ke Database hanya dilakukan oleh Backend Node.js.
4. **AI Service (Layanan Komputasi Terisolasi):** Dibangun dengan **Python FastAPI** (berjalan di port `8000`). Layanan ini berjalan independen dan tidak memiliki akses langsung ke Database maupun Frontend. Fungsinya murni mengolah komputasi model *Machine Learning*:
   - *Sistem Rekomendasi:* Menerima parameter judul, melakukan kalkulasi matematika (*Cosine Similarity*) menggunakan file `.pkl` dan `.csv`, lalu mengembalikan sekumpulan ID film teratas ke Backend.
   - *Analisis Sentimen:* Menerima parameter teks dari Backend, memprosesnya melalui model TensorFlow/Keras (`.keras`), dan mengembalikan label klasifikasi (contoh: *Positive* / *Negative*).

---

## 1. Divisi Data Science
**Hal Krusial Jika Melakukan Perubahan:**
- **Output Artifacts:** Jika melatih ulang model, pastikan *output* file (seperti `.keras`, `.pkl`, dan `.csv`) ditimpa ke folder `backend/` atau `backend/models/` agar bisa dibaca langsung oleh FastAPI.
- **Konsistensi Versi TensorFlow/Keras:** Pastikan versi TensorFlow saat melakukan *training* (di `.ipynb`) sama dengan versi yang terinstal di `requirements.txt` backend. Jika ada perbedaan versi, Keras layer (seperti `Embedding`) bisa *crash* di tahap *inference* karena isu kompatibilitas.
- **Format Kolom CSV:** Jika memperbarui data film (`unique_movies_content_based.csv`), JANGAN ubah nama kolom `judul_film`, `id_film`, atau `genre_utama`. Kolom-kolom ini wajib ada karena dibaca langsung oleh sistem Rekomendasi di API Python.

---

## 2. Divisi AI (FastAPI - Python)
model *Machine Learning* berjalan di port `8000`.

**Hal Krusial Jika Melakukan Perubahan:**
- **Endpoint Wajib:** Node.js Backend sangat bergantung pada dua *endpoint* ini. Jangan ubah strukturnya tanpa memberi tahu divisi Backend!
  - `POST /predict_sentiment` (menerima JSON `{"text": "ulasan"}`)
  - `POST /recommend` (menerima JSON `{"title": "judul film", "top_n": 5}`)
- **Error Handling (Fallback):** FastAPI tidak boleh *crash*. Jika *request* gagal, input kosong, atau judul film tidak ditemukan di CSV, kembalikan nilai *default* (contoh: sentimen `Netral` atau mengembalikan array ID film rekomendasi terpopuler).
- **Restart Server:** Jika ada pembaruan pada model `.keras` atau `.pkl` dari divisi Data Science, server FastAPI (`uvicorn api:app`) HARUS di-*restart* karena model dimuat ke dalam memori RAM saat server pertama kali menyala.

---

## 3. Divisi Backend (Node.js)
Divisi Backend menghubungkan *Database* PostgreSQL (Supabase), AI (FastAPI), dan melayani *request* dari Frontend melalui port `5000`.

**Hal Krusial Jika Melakukan Perubahan:**
- **Sinkronisasi Database:** 
  - Backend menggunakan **Supabase PostgreSQL**. Skema tabel utama adalah `users`, `movies`, dan `reviews`.
  - Jika mengubah struktur tabel (contoh: mengubah nama tabel atau menambah kolom), pastikan *query* SQL di *Controllers* (`movieController.js`, `reviewController.js`) juga diperbarui.
- **Autentikasi (JWT):** Route yang sensitif (seperti `POST /reviews` atau `GET /users/check-profile`) dilindungi oleh middleware `authMiddleware.js`. Middleware ini akan mengecek *Access Token* yang dikirim dari Frontend. Jangan hapus pelindung middleware ini pada *route* transaksi data pengguna!
- **Koneksi ke AI:** Node.js akan memanggil FastAPI di `http://127.0.0.1:8000`. Jika port FastAPI berubah (atau jika AI dipindahkan ke Cloud URL terpisah), pastikan memperbarui URL target di `src/utils/aiClient.js` dan `recommendationHelper.js`.
- **Transisi ke Produksi (Pengaturan RLS Supabase):** 
  Saat ini, fungsi pembuatan profil di `userController.js` menggunakan koneksi *Super Admin* (`db.query`) untuk mempercepat demo (mem-bypass RLS). **Untuk tahap produksi**, sistem ini wajib dikembalikan menggunakan *Supabase Client* demi keamanan. Ikuti 2 langkah ini:
  
  **Langkah 1: Mengatur RLS di Dashboard Supabase**
  1. Buka *Dashboard* Supabase -> menu **Authentication** -> **Policies** (atau Database -> Policies).
  2. Cari tabel `users`, buat *Policy* baru.
  3. Pilih aksi **INSERT**, dengan target *Authenticated Users*.
  4. Isi kolom *Expression* dengan: `true` (atau `auth.uid() = id` jika struktur tabel Anda mendukung). Simpan *policy*.
  
  **Langkah 2: Mengubah Kode di `userController.js`**
  Hapus kode `db.query` untuk `INSERT`, dan kembalikan pemanggilan `supabase.from('users').insert(...)` menggunakan *Supabase Client* berbekal `ANON_KEY`.

---

## 4. Divisi Frontend (Next.js)
Divisi Frontend mengatur tampilan antarmuka interaktif di port `3000` menggunakan Next.js (App Router), Tailwind CSS, dan Supabase Client.

**Hal Krusial Jika Melakukan Perubahan:**
- **API Interceptor (Server-Side vs Client-Side):**
  - Aplikasi menggunakan Axios Interceptor di `src/lib/api.ts` untuk menyuntikkan token keamanan Supabase secara otomatis ke *headers*.
  - **PENTING:** Jangan pernah memanggil fungsi *client-side* Supabase (`supabase.auth.getSession()`) di dalam lingkungan Node.js (Server Components)! Interceptor wajib dibungkus dengan `if (typeof window !== 'undefined')` untuk mencegah *crash* atau *hanging* saat proses *Server-Side Rendering* (SSR) seperti pada halaman `/search`.
- **Penggunaan `searchParams` & `params`:** Pada Next.js 15+, objek parameter di *Server Components* telah berubah menjadi *Promise*. Selalu gunakan `await searchParams` atau `await params` (contoh: `const resolvedParams = await params;`) sebelum membaca isinya.
- **Konfirmasi Email (Supabase Auth):** Saat tahap *development*, fitur *"Confirm Email"* di Supabase dimatikan agar mempermudah pengujian. Jika divisi Frontend menghidupkannya untuk produksi, mereka wajib menangani UI pendaftaran untuk meminta pengguna membuka email terlebih dahulu, bukan memaksa langsung *login*.
- **Desain UI & Komponen:** Tetap gunakan komponen `Radix UI` di folder `src/components/ui/` jika menambah tombol atau navigasi baru agar konsistensi desain premium tetap terjaga.
- **Migrasi / Ganti Framework Frontend:** Jika Frontend memutuskan untuk tidak menggunakan Next.js (misal beralih ke Vite/React murni, Vue, Svelte, atau Flutter), pastikan hal-hal berikut dipenuhi:
  1. **Autentikasi Supabase:** Cukup gunakan library standar `@supabase/supabase-js`. Pastikan integrasi untuk pendaftaran dan pembuatan sesi (JWT) tetap berjalan normal.
  2. **Injeksi Token API:** Mekanisme pengiriman *Token Bearer JWT* ke Backend Node.js (melalui interceptor) wajib direplikasi. Tanpa ini, seluruh fungsi ulasan dan profil akan mengembalikan pesan `401 Unauthorized`.
  3. **CORS (Cross-Origin Resource Sharing):** Port aplikasi saat pengembangan lokal kemungkinan besar akan berubah dari `3000` (contohnya `5173` untuk Vite). Divisi Frontend WAJIB memberi tahu Backend agar *Whitelist CORS* di `backend/src/app.js` diperbarui agar koneksi API tidak ditolak oleh *Browser*.

---

## 5. Cara Menjalankan Layanan (Development)
Untuk menjalankan proyek ini di mesin lokal, Anda WAJIB membuka 3 buah terminal terpisah, karena setiap layanan berjalan di *environment* dan bahasa pemrograman yang berbeda:

**Terminal 1: Menjalankan AI FastAPI (Python)**
- Buka terminal, arahkan ke folder `backend/`
- Jalankan perintah: `uvicorn api:app --reload --port 8000`
- *Tunggu hingga muncul tulisan "Application startup complete"*

**Terminal 2: Menjalankan Backend Node.js (Express)**
- Buka terminal baru, arahkan ke folder `backend/`
- Jalankan perintah: `npm run dev`
- *Tunggu hingga muncul tulisan "berhasil terhubung ke database online Supabase"*

**Terminal 3: Menjalankan Frontend (Next.js)**
- Buka terminal baru, arahkan ke folder `frontend/`
- Jalankan perintah: `npm run dev`
- *Buka `http://localhost:3000` di Browser Anda.*

---
**Catatan Umum:** Sistem aplikasi ini mengandalkan arsitektur *microservices* yang saling terhubung. Jika satu divisi mengganti tipe data request/response, WAJIB menginformasikannya ke divisi yang terhubung agar tidak terjadi *Axios Network Error 400/404/500*.
