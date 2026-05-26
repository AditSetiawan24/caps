*1. SQL DATABASE*

CREATE TABLE users (
    user_id VARCHAR(100) PRIMARY KEY, 
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,        
    password VARCHAR(255),           
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE movies (
    id_film NUMERIC PRIMARY KEY,          
    judul_film VARCHAR(255) NOT NULL,
    anggaran DECIMAL(15,2),                  
    bahasa_asli VARCHAR(10),
    ringkasan_film TEXT,
    popularitas DECIMAL(10, 6),      
    negara_produksi VARCHAR(100),
    tanggal_rilis DATE,            
    pendapatan DECIMAL(15,2),
    durasi_menit DECIMAL(5,2),
    skor_rata_rata FLOAT,    
    jumlah_pemberi_skor INT,
    link_poster VARCHAR(500),
    genre_utama VARCHAR(100)
);

-- 3. PEMBUATAN TABEL REVIEWS
CREATE TABLE reviews (
    id_review SERIAL PRIMARY KEY,            -- Auto Increment di PostgreSQL menggunakan SERIAL
    user_id VARCHAR(100) REFERENCES users(user_id) ON DELETE CASCADE,
    id_film NUMERIC REFERENCES movies(id_film) ON DELETE CASCADE,
    ulasan_pengguna TEXT NOT NULL,
    ulasan_bersih TEXT,               
    kategori_sentimen VARCHAR(50),    -- Positif, Negatif, Netral
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PEMBUATAN TABEL RATINGS
CREATE TABLE ratings (
    id_rating SERIAL PRIMARY KEY,            -- Auto Increment
    user_id VARCHAR(100) REFERENCES users(user_id) ON DELETE CASCADE,
    id_film NUMERIC REFERENCES movies(id_film) ON DELETE CASCADE,
    rating_pengguna NUMERIC(3, 1) NOT NULL -- Menggunakan NUMERIC karena di dataset ada rating berbentuk desimal seperti 4.5
);