const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all dogs
router.get('/', async (req, res) => {
  try {
    // Select all columns from the Dogs table, which includes dog_id, owner_id, name, and size
    const [rows] = await db.query('SELECT * FROM Dogs');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

module.exports = router;