// Menggunakan 'import' sebagai ganti 'require'
import mysql from 'mysql2/promise';

// Konfigurasi koneksi database diambil dari Environment Variables di Vercel
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    ssl: {
        // Untuk tes lokal, Anda bisa set ke false jika ada masalah sertifikat
        // Di production Vercel, set ke true
        rejectUnauthorized: true 
    },
    connectTimeout: 10000
};

// Ini adalah handler utama yang akan dijalankan Vercel
export default async function handler(req, res) {
    
    // Mengizinkan request dari mana saja (CORS)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Vercel perlu merespon request OPTIONS untuk pre-flight check CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Membedakan logika berdasarkan metode request (GET, POST, DELETE)
    switch (req.method) {
        case 'GET':
            await handleGet(req, res);
            break;
        case 'POST':
            await handlePost(req, res);
            break;
        case 'DELETE':
            await handleDelete(req, res);
            break;
        default:
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

// Fungsi untuk menangani GET request
async function handleGet(req, res) {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM results ORDER BY created_at DESC');
        await connection.end();
        res.status(200).json(rows);
    } catch (error) {
        console.error('Failed to fetch results:', error);
        res.status(500).json({ message: 'Error fetching data from database', error: error.message });
    }
}

// Fungsi untuk menangani POST request
async function handlePost(req, res) {
    const { name, phone, company, liked, noped } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ message: 'Name and phone are required' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const sql = 'INSERT INTO results (name, phone, company_name, liked_items, noped_items) VALUES (?, ?, ?, ?, ?)';
        const likedJson = JSON.stringify(liked);
        const nopedJson = JSON.stringify(noped);

        await connection.execute(sql, [name, phone, company, likedJson, nopedJson]);
        await connection.end();
        
        res.status(201).json({ message: 'Result saved successfully!' });
    } catch (error) {
        console.error('Failed to save result:', error);
        res.status(500).json({ message: 'Error saving data to database', error: error.message });
    }
}

// Fungsi untuk menangani DELETE request
async function handleDelete(req, res) {
     try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM results');
        await connection.end();
        res.status(200).json({ message: 'All data cleared successfully.' });
    } catch (error) {
        console.error('Failed to clear data:', error);
        res.status(500).json({ message: 'Error clearing data.', error: error.message });
    }
}