const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all dogs with owner id
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT dog_id, owner_id, name, size FROM Dogs');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

module.exports = router;