const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all dogs for public view
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT dog_id, name, size, owner_id
      FROM Dogs
      ORDER BY dog_id ASC
    `);
    res.json(rows);
  } catch (error) => {
    console.error('Error fetching dogs for public view:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

module.exports = router;