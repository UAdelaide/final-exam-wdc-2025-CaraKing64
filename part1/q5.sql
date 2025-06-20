USE DogWalkService;
INSERT INTO Users (username, email, password_hash, role) VALUES ('alice123', 'alice@example.com', 'hashed123', 'owner'), ('bobwalker', 'bob@example.com', 'hashed456', 'walker'), ('carol123', 'carol@example.com', 'hashed789', 'owner'), ('dantheman', 'dan@example.com', 'hashed222', 'owner'), ('ellywalks', 'elly@example.com', 'hashed444', 'walker');
INSERT INTO Dogs (owner_id, name, size) VALUES ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'), ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'), ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Ginger', 'small'), ((SELECT user_id FROM Users WHERE username = 'dantheman'), 'Rex', 'medium'), ((SELECT user_id FROM Users WHERE username = 'dantheman'), 'Gojo', 'large');
INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'), ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'), ((SELECT dog_id FROM Dogs WHERE name = 'Ginger'), '2025-06-10 12:00:00', 60, 'Lakelands', 'open'), ((SELECT dog_id FROM Dogs WHERE name = 'Rex'), '2025-05-11 8:00:00', 20, 'Explex Court', 'completed'), ((SELECT dog_id FROM Dogs WHERE name = 'Gojo'), '2025-06-12 15:00:00', 40, 'Jujutsu High', 'completed');
INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating, comments) VALUES
(
  (SELECT request_id FROM WalkRequests WHERE location = 'Explex Court'),
  (SELECT user_id FROM Users WHERE username = 'bobwalker'),
  (SELECT owner_id FROM WalkRequests INNER JOIN Dogs ON WalkRequests.dog_id = Dogs.dog_id WHERE location = 'Explex Court'),
  5,
  "This walk was amazing! Rex loved it so much and was so happy when "
), (
  (SELECT request_id FROM WalkRequests WHERE location = 'Jujutsu High'),
  (SELECT user_id FROM Users WHERE username = 'bobwalker'),
  (SELECT owner_id FROM WalkRequests INNER JOIN Dogs ON WalkRequests.dog_id = Dogs.dog_id WHERE location = 'Jujutsu High'),
  4
);