import express, { response } from "express";
import session from 'express-session'
import pg from "pg";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

// const config = {
//   type: 'sparkline',
//   data: {
//     datasets: [{
//       data: ['12.93297', '13.22083', '13.96894', '14.14472', '14.33402', '14.00781', '13.10215', '12.46830', '11.78568', '10.96955', '10.97333', '11.40577', '11.21083', '11.12855', '11.45648', '11.80963', '12.39805', '13.03173', '11.91138', '10.51463', '9.01044', '9.14316', '9.28610', '9.80866', '10.44900', '10.39581', '10.62092', '10.86336', '11.67024', '11.84780']
//     }]
//   }
// }

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "stalker",
  password: "JDjd28690406$$",
  port: 5432,
});

let name_taken = true;
let check = true;
let current_users = [];

app.use(session({
  secret: 'aniamtedCrutons486',
  resave: false,
  saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.get("/", async (req, res) => {
  res.render("index.ejs", { name_taken: name_taken });
});

app.post("/sign-up", async (req, res) => {
  const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "stalker",
    password: "JDjd28690406$$",
    port: 5432,
  });

  db.connect();

  const response = await db.query("SELECT * FROM auth");

  console.log(req.body.new_username);

  response.rows.forEach((user) => {
    current_users.push(user.username);
  });

  if (!current_users.includes(req.body.new_username)) {
    name_taken = false;
  }

  if (name_taken == false) {
    await db.query("INSERT INTO auth (username, password) VALUES ($1, $2)", [
      req.body.new_username,
      req.body.new_password,
    ]);
  }

  db.end();

  res.render("index.ejs", {
    name_taken: name_taken,
    username: req.body.new_username,
  });
});

app.post("/login", async (req, res) => {

  const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "stalker",
    password: "JDjd28690406$$",
    port: 5432,
  });

  /* authentication */

  db.connect();

  const user = await db.query("SELECT * FROM auth WHERE username = $1", [
    req.body.username,
  ]);

  let exists = false;

  db.end();

  console.log(user.rows[0].password);

  /* directs to user page */

  if (user.rows[0].password == req.body.password) {
    const db = new pg.Client({
      user: "postgres",
      host: "localhost",
      database: "stalker",
      password: "JDjd28690406$$",
      port: 5432,
    });

    db.connect();

    /* check for user profile information */

    const user_check = await db.query("SELECT * FROM profile");

    for (let i = 0; i < user_check.rows.length; i++) {
      if (user_check.rows[i].username.includes(req.body.username)) {
        exists = true;
      }
    }

    /* profile setup */ 

    var startQuestion = false;

    /* pass username incase of setup */

    const username = req.body.username;
    req.session.username = username;

    const pref = req.body.selection
    req.session.selection = pref;
    console.log('username-saved', {username}, 'selection-saved', {pref});

    /* insert data into profile table as needed */

    if (exists === true) {

      const profile = await db.query(
        "SELECT * FROM profile WHERE username = ($1)", [
          req.body.username,
        ]);

      if (profile.rows[0].stock_pref === null) {
        startQuestion = true;
      };

      res.render("home.ejs", { profile: profile, setup: startQuestion });

      console.log('yup');

    } else {

      startQuestion = true;

      await db.query("INSERT INTO profile (username) VALUES ($1)", [
        req.body.username,
      ]);

      const profile = await db.query(
        "SELECT * FROM profile WHERE username = ($1)", [
          req.body.username,
        ]);

      res.render("home.ejs", { profile: profile, setup: startQuestion });
    }

    } else {    /* auth fail */
      check = false;

      res.render("index.ejs", {
      name_taken: name_taken,
      check: check,
      username: req.body.new_username,
     });
    }

    db.end();


});

app.post("/user-setup", async (req, res) => {
  const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "stalker",
    password: "JDjd28690406$$",
    port: 5432,
  });
  db.connect();

  console.log('request', req.body );

  const username = req.session.username;
  console.log('passed', username);

  const pref = req.body.selection;
  console.log(pref);

  var startQuestion = false;

  /* insert form data */

  console.log(req.body.name)

  const update = await db.query(
    "UPDATE profile SET name = $1, stock_pref = $2 WHERE username = $3 ", [req.body.name, pref, username]
  );

  /* grab user profile */

  const profile = await db.query(
    "SELECT * FROM profile WHERE username = ($1)", [username]
  );

  console.log(profile.rows[0]);

  db.end();
  
  res.render('home.ejs', { profile: profile, setup: startQuestion });
});

app.listen(3000, () => {
  console.log(`Server running on port ${port}.`);
});


