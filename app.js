import express from "express";
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

app.use(bodyParser.urlencoded({ extended: true }));
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

  db.connect();

  const user = await db.query("SELECT * FROM auth WHERE username = $1", [
    req.body.username,
  ]);

  let exists = false;

  db.end();

  console.log(user.rows[0].password);

  if (user.rows[0].password == req.body.password) {
    const db = new pg.Client({
      user: "postgres",
      host: "localhost",
      database: "stalker",
      password: "JDjd28690406$$",
      port: 5432,
    });

    db.connect();

    const user_check = await db.query("SELECT * FROM profile");

    console.log(user_check.rows[1]);

    for (let i = 0; i < user_check.rows.length; i++) {
      if (user_check.rows[i].username.includes(req.body.username)) {
        exists = true;
      }
    }

    var startQuestion = false;

    const profile = await db.query(
      "SELECT * FROM profile WHERE username = ($1)", [
        req.body.username,
      ]);
  
    if (profile.rows[0].stock_pref === null) {
      startQuestion = true;
    };

    if (exists === true) {
      res.render("home.ejs", { user: user, profile: profile, setup: startQuestion });
    } else {
      await db.query("INSERT INTO profile (username) VALUES ($1)", [
        req.body.username,
      ]);
      res.render("home.ejs", { user: user, profile: profile, startQuestion: setup });
    }

    } else {
      check = false;

      res.render("index.ejs", {
      name_taken: name_taken,
      check: check,
      username: req.body.new_username,
     });
    }

  db.end();


});

app.listen(3000, () => {
  console.log(`Server running on port ${port}.`);
});
