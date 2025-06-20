var express = require('express');
var router = express.Router();
var mysql = require('mysql2/promise');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


let db;
(async () => {
  try {
    // Connect to MySQL without specifying a database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '' // Set your MySQL root password
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

    // Create tables if they don't exist
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

    // Insert data if table is empty
    const [rows] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (rows[0].count === 0) {
      await db.execute(`
        INSERT INTO Users (username, email, password_hash, role) VALUES
        ('alice123', 'alice@example.com', 'hashed123', 'owner'),
        ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
        ('carol123', 'carol@example.com', 'hashed789', 'owner'),
        ('dantheman', 'dan@example.com', 'hashed222', 'owner'),
        ('ellywalks', 'elly@example.com', 'hashed444', 'walker')
      `);
    }
    const [rows2] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
    if (rows2[0].count === 0){
      await db.execute(`
        INSERT INTO Dogs (owner_id, name, size) VALUES
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Ginger', 'small'),
        ((SELECT user_id FROM Users WHERE username = 'dantheman'), 'Rex', 'medium'),
        ((SELECT user_id FROM Users WHERE username = 'dantheman'), 'Gojo', 'large');
      `);
    }
    const [rows3] = await db.execute('SELECT COUNT(*) AS count FROM WalkRequests');
    if (rows3[0].count === 0){
      await db.execute(`
        INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
        ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Ginger'), '2025-06-10 12:00:00', 60, 'Lakelands', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Rex'), '2025-05-11 8:00:00', 20, 'Explex Court', 'completed'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Gojo'), '2025-06-12 15:00:00', 40, 'Jujutsu High', 'completed')
      `);
    }
    const [rows4] = await db.execute('SELECT COUNT(*) AS count FROM WalkApplications');
    if (rows4[0].count === 0){
      await db.execute(`
        INSERT INTO WalkApplications (request_id, walker_id, status) VALUES
        (
          (SELECT request_id FROM WalkRequests WHERE location = 'Explex Court'),
          (SELECT user_id FROM Users WHERE username = 'bobwalker'),
          'accepted'
        ), (
          (SELECT request_id FROM WalkRequests WHERE location = 'Jujutsu High'),
          (SELECT user_id FROM Users WHERE username = 'bobwalker'),
          'accepted'
        );
      `);
    }
    const [rows5] = await db.execute('SELECT COUNT(*) AS count FROM WalkRatings');
    if (rows5[0].count === 0){
      await db.execute(`
        INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating, comments) VALUES
        (
          (SELECT request_id FROM WalkRequests WHERE location = 'Explex Court'),
          (SELECT user_id FROM Users WHERE username = 'bobwalker'),
          (SELECT owner_id FROM WalkRequests INNER JOIN Dogs ON WalkRequests.dog_id = Dogs.dog_id WHERE location = 'Explex Court'),
          5,
          "This walk was amazing! Rex loved it so much and was so happy when I came home!"
        ), (
          (SELECT request_id FROM WalkRequests WHERE location = 'Jujutsu High'),
          (SELECT user_id FROM Users WHERE username = 'bobwalker'),
          (SELECT owner_id FROM WalkRequests INNER JOIN Dogs ON WalkRequests.dog_id = Dogs.dog_id WHERE location = 'Jujutsu High'),
          4,
          "This was a good walk but the walker forgot to bring treats with him and Gojo didn't get any rewards on his walk."
        )
      `);
    }

  } catch (err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();

router.get('/api/dogs', async function(req, res, next){
  // for each dog, get the details about the dog including the username of the owner
  const [rows] = await db.execute('SELECT name, size, username FROM (Users INNER JOIN Dogs ON Users.user_id = Dogs.owner_id)');

  // need to make a new object for each row to rename the 'username' attribute to 'owner_username'
  var res_rows = [];
  for (let i = 0; i < rows.length; i++){
    res_rows.push({
      dog_name: rows[i].name,
      size: rows[i].size,
      owner_username: rows[i].username
    });
  }
  // send results
  res.status(200);
  res.send(res_rows);
});

router.get('/api/walkrequests/open', async function(req, res, next){
  // for each walk request, get the details about the walk request, including the username of the dog owner
  const [rows] = await db.execute(`SELECT request_id, name, requested_time, duration_minutes, location, username FROM ((WalkRequests INNER JOIN Dogs ON WalkRequests.dog_id = Dogs.dog_id) INNER JOIN Users ON Dogs.owner_id = Users.user_id) where status = 'open';`);

  // need to make a new object for each row to rename the 'username' attribute to 'owner_username'
  var res_rows = [];
  for (let i = 0; i < rows.length; i++){
    res_rows.push({
      request_id: rows[i].request_id,
      dog_name: rows[i].name,
      requested_time: rows[i].requested_time,
      duration_minutes: rows[i].duration_minutes,
      location: rows[i].location,
      owner_username: rows[i].username
    });
  }
  // send results
  res.status(200);
  res.send(res_rows);
});

router.get('/api/walkers/summary', async function(req, res, next){
  // get all users who are dog walkers
  const [walkers] = await db.execute(`SELECT username, user_id FROM Users WHERE role = 'walker'`);
  // get all ratings for all walkers
  const [ratings] = await db.execute(`SELECT username, rating FROM (Users INNER JOIN WalkRatings ON Users.user_id = WalkRatings.walker_id)`);
  // get all completed walks (assuming that accepted walks are completed walks and nothing went wrong / no unlogged cancellations)
  const [completedwalks] = await db.execute(`SELECT walker_id, WalkRequests.status, WalkApplications.status FROM WalkApplications INNER JOIN WalkRequests ON WalkApplications.request_id = WalkRequests.request_id WHERE WalkRequests.status = 'completed' and WalkApplications.status = 'accepted'`);

  // loop through all the walkers and process them
  var res_rows = [];
  for (let i = 0; i < walkers.length; i++){
    var w = { // walker object
      walker_username: walkers[i].username,
      walker_id: walkers[i].user_id,
      total_ratings: 0,
      average_rating: null,
      rating_sum: 0,
      completed_walks: 0
    };
    // count the number of ratings
    for (let j = 0; j < ratings.length; j++){
      // if the current rating is for the current walker, increment it and add the rating to the sum to average at the end
      if (ratings[j].username === w.walker_username){
        w.total_ratings += 1;
        w.rating_sum += ratings[j].rating;
      }
    }
    // if there were ratings, average them
    if (w.total_ratings !== 0){
      w.average_rating = w.rating_sum / w.total_ratings;
    }
    // count the number of completed walks
    for (let j = 0; j < completedwalks.length; j++){
      if (completedwalks[j].walker_id === w.walker_id){
        w.completed_walks += 1;
      }
    }
    // remove unwanted variables
    delete w.rating_sum;
    delete w.walker_id;
    res_rows.push(w);
  }
  res.status(200);
  res.send(res_rows);
});

module.exports = router;
