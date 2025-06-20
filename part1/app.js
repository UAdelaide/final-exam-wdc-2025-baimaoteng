var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

let db;

// Database setup and initialization
(async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });

    // Create the database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
    await connection.end();

    // Now connect to the created database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });

    // Create tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS Users (
          user_id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role ENUM('owner', 'walker') NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS Dogs (
          dog_id INT AUTO_INCREMENT PRIMARY KEY,
          owner_id INT NOT NULL,
          name VARCHAR(50) NOT NULL,
          size ENUM('small', 'medium', 'large') NOT NULL,
          FOREIGN KEY (owner_id) REFERENCES Users(user_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS WalkRequests (
          request_id INT AUTO_INCREMENT PRIMARY KEY,
          dog_id INT NOT NULL,
          requested_time DATETIME NOT NULL,
          duration_minutes INT NOT NULL,
          location VARCHAR(255) NOT NULL,
          status ENUM('open', 'accepted', 'completed', 'cancelled') DEFAULT 'open',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (dog_id) REFERENCES Dogs(dog_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS WalkApplications (
          application_id INT AUTO_INCREMENT PRIMARY KEY,
          request_id INT NOT NULL,
          walker_id INT NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
          FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
          FOREIGN KEY (walker_id) REFERENCES Users(user_id),
          CONSTRAINT unique_application UNIQUE (request_id, walker_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS WalkRatings (
          rating_id INT AUTO_INCREMENT PRIMARY KEY,
          request_id INT NOT NULL,
          walker_id INT NOT NULL,
          owner_id INT NOT NULL,
          rating INT CHECK (rating BETWEEN 1 AND 5),
          comments TEXT,
          rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
          FOREIGN KEY (walker_id) REFERENCES Users(user_id),
          FOREIGN KEY (owner_id) REFERENCES Users(user_id),
          CONSTRAINT unique_rating_per_walk UNIQUE (request_id)
      )
    `);

    // Insert test data if tables are empty
    const [userRows] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (userRows[0].count === 0) {
      // Insert test users
      await db.execute(`
        INSERT INTO Users (username, email, password_hash, role) VALUES
        ('alice123', 'alice@example.com', 'hashed123', 'owner'),
        ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
        ('carol123', 'carol@example.com', 'hashed789', 'owner'),
        ('lucateng', 'luca.teng@adelaide.edu.au', 'hashedabc', 'owner'),
        ('wdc2207', 'cs2207cc@adelaide.edu.au', 'hashedwdc', 'walker')
      `);


      await db.execute(`
        INSERT INTO Users (username, email, password_hash, role) VALUES
        ('alice123', 'alice@example.com', 'hashedpass1', 'owner'),
        ('carol123', 'carol@example.com', 'hashedpass2', 'owner'),
        ('bobwalker', 'bob@example.com', 'hashedpass3', 'walker'),
        ('newwalker', 'newwalker@example.com', 'hashedpass4', 'walker')
      `);

      // Insert test dogs
      await db.execute(`
        INSERT INTO Dogs (owner_id, name, size) VALUES
        (1, 'Max', 'medium'),
        (2, 'Bella', 'small'),
        (1, 'Charlie', 'large')
      `);

      // Insert test walk requests
      await db.execute(`
        INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
        (1, '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
        (2, '2025-06-11 09:00:00', 45, 'Central Park', 'completed'),
        (3, '2025-06-12 10:00:00', 60, 'Beach Walk', 'open')
      `);

      // Insert test walk ratings for completed walks
      await db.execute(`
        INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating, comments) VALUES
        (2, 3, 2, 5, 'Excellent walker!'),
        (2, 3, 2, 4, 'Good service')
      `);
    }

    console.log('Database setup completed successfully');
  } catch (err) {
    console.error('Error setting up database. Ensure MySQL is running: service mysql start', err);
  }
})();

// API Routes

// Route 1: /api/dogs - Return all dogs with size and owner username
app.get('/api/dogs', async (req, res) => {
  try {
    const [dogs] = await db.execute(`
      SELECT d.name AS dog_name, d.size, u.username AS owner_username
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

// Route 2: /api/walkrequests/open - Return all open walk requests
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [requests] = await db.execute(`
      SELECT wr.request_id, d.name AS dog_name, wr.requested_time,
             wr.duration_minutes, wr.location, u.username AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
      ORDER BY wr.requested_time
    `);
    res.json(requests);
  } catch (err) {
    console.error('Error fetching open walk requests:', err);
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});

// Route 3: /api/walkers/summary - Return walker summary with ratings and completed walks
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [walkers] = await db.execute(`
      SELECT
        u.username AS walker_username,
        COALESCE(rating_stats.total_ratings, 0) AS total_ratings,
        rating_stats.average_rating,
        COALESCE(completed_stats.completed_walks, 0) AS completed_walks
      FROM Users u
      LEFT JOIN (
        SELECT
          walker_id,
          COUNT(*) AS total_ratings,
          AVG(rating) AS average_rating
        FROM WalkRatings
        GROUP BY walker_id
      ) rating_stats ON u.user_id = rating_stats.walker_id
      LEFT JOIN (
        SELECT
          wr.walker_id,
          COUNT(*) AS completed_walks
        FROM WalkRatings wr
        GROUP BY wr.walker_id
      ) completed_stats ON u.user_id = completed_stats.walker_id
      WHERE u.role = 'walker'
      ORDER BY u.username
    `);
    res.json(walkers);
  } catch (err) {
    console.error('Error fetching walker summary:', err);
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
