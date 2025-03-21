// server/routes/transactions.js
const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Get all transactions
router.get('/', (req, res) => {
  db.all('SELECT * FROM transactions ORDER BY date DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get transactions by month
router.get('/monthly/:year/:month', (req, res) => {
  const { year, month } = req.params;
  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-31`; // Simplified for demo

  db.all(
    'SELECT * FROM transactions WHERE date BETWEEN ? AND ? ORDER BY date DESC',
    [startDate, endDate],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get transaction by ID
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM transactions WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(row);
  });
});

// Add a new transaction
router.post('/', (req, res) => {
  const { amount, category, description, date, type } = req.body;
  
  if (!amount || !category || !date || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO transactions (amount, category, description, date, type) VALUES (?, ?, ?, ?, ?)',
    [amount, category, description, date, type],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Update a transaction
router.put('/:id', (req, res) => {
  const { amount, category, description, date, type } = req.body;
  
  if (!amount || !category || !date || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'UPDATE transactions SET amount = ?, category = ?, description = ?, date = ?, type = ? WHERE id = ?',
    [amount, category, description, date, type, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json({ updated: this.changes });
    }
  );
});

// Delete a transaction
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM transactions WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
