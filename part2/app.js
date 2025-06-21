const express = require('express');
const path = require('path');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const session = require('express-session');
const db = require('./models/db');

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

// API endpoint for dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [dogs] = await db.query(`
      SELECT d.dog_id, d.name, d.size, u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
      ORDER BY d.name
    `);
    res.json(dogs);
  } catch (err) {
    console.error('Error fetching dogs:', err);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;