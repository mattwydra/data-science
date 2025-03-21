// server/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a new database connection
const db = new sqlite3.Database(path.join(__dirname, 'finance_tracker.db'));

// Initialize database tables
const initializeDatabase = () => {
    db.serialize(() => {
        // Create transactions table
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      user_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

        // Create users table for future authentication
        db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

        console.log('Database initialized successfully');
    });
};

module.exports = { db, initializeDatabase };

// server/server.js
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./database');
const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/transactions', transactionRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});