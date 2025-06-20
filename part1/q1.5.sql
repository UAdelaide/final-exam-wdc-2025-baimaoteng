-- Insert Users
INSERT INTO Users (username, email, password_hash, role) VALUES
('alice123', 'alice@example.com', 'hashed123', 'owner'),
('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
('carol123', 'carol@example.com', 'hashed789', 'owner'),
('lucateng', 'luca.teng@adelaide.edu.au', 'hashedabc', 'owner'),
('wdc2207', 'cs2207cc@adelaide.edu.au', 'hashedwdc', 'walker');

-- Insert Dogs
INSERT INTO Dogs (owner_id, name, size) VALUES
((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
((SELECT user_id FROM Users WHERE username = 'lucateng'), 'Charlie', 'large'),
((SELECT user_id FROM Users WHERE username = 'lucateng'), 'Cooper', 'medium'),
((SELECT user_id FROM Users WHERE username = 'carol123'), 'Daisy', 'small');

-- Insert Walk Requests
INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),

-- Request for Bella
((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),

-- Additional walk requests (3 more as requested)
-- Request for Charlie
((SELECT dog_id FROM Dogs WHERE name = 'Charlie'), '2025-06-11 07:00:00', 60, 'North Adelaide Park', 'open'),

-- Request for Cooper
((SELECT dog_id FROM Dogs WHERE name = 'Cooper'), '2025-06-11 16:30:00', 45, 'Victoria Square', 'open'),

-- Request for Daisy
((SELECT dog_id FROM Dogs WHERE name = 'Daisy'), '2025-06-12 10:15:00', 30, 'Elder Park', 'completed');