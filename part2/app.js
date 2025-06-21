const express = require('express');
const path = require('path');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dog_walk_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

// Add dogs API endpoint
app.get('/api/dogs', async (req, res) => {
  const db = require('./models/db');
  try {
    const [rows] = await db.query(`
      SELECT d.dog_id, d.name, d.size, d.owner_id
      FROM Dogs d
      ORDER BY d.name
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;