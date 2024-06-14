import express, { response } from "express";
import session from "express-session";
import sqlite3 from "sqlite3";
import axios, { all } from "axios";
import bodyParser from "body-parser";
import QuickChart from "quickchart-js";
import { Chart, Tooltip } from "chart.js/auto";
import sharp from "sharp";

const app = express();
const port = 3000;
let check = true;

const db = new sqlite3.Database("./data/stalker.db", (err) => {
    if (err) {
        console.log("Could not connect to database");
    } else {
        console.log("Connection successful");
    }
});

/* db interactions */

    async function select(query, params) {
        try {
            const rows = await new Promise((resolve, reject) => {
                db.all(query, params, (err, rows) => {
                    if (err) {
                        console.log("unable to access data from database");
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
            return rows;
        } catch (err) {
            console.error(err);
        }
    }

async function insert(query, params) {
    try {
        const rows = await new Promise((resolve, reject) => {
            db.run(query, params, function (err) {
                if (err) {
                    console.log("unable to insert data from database");
                    reject(err);
                } else {
                    resolve(this);
                }
            });
        });
        return rows;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function slowSelect(batchSize, userPref) {
    let offset = 0;
    let dataRows = [];

    await new Promise((resolve, reject) => {
        function fetchNextBatch() {
            db.all(
                `SELECT * FROM ${userPref} LIMIT ${batchSize} OFFSET ${offset}`,
                (err, rows) => {
                    if (err) {
                        console.error("Error fetching data:", err);
                        return;
                    }

                    processBatch(rows);

                    if (rows.length === batchSize) {
                        offset += batchSize;
                        fetchNextBatch();
                    } else {
                        resolve(dataRows);
                    }
                }
            );
        }

        function processBatch(rows) {
            rows.forEach((row) => {
                dataRows.push(row);
            });
        }

        fetchNextBatch();
    });

    return dataRows;
}

/* middleware */

    app.use(
        session({
            secret: "aniamtedCrutons486",
            resave: false,
            saveUninitialized: true,
        })
    );

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

/* lander */

    app.get("/", async (req, res) => {
        res.render("index.ejs", { name_taken: "" });
    });

app.post("/sign-up", async (req, res) => {
    const db = new sqlite3.Database("./data/stalker.db", (err) => {
        if (err) {
            console.log("Could not connect to database");
        } else {
            console.log("Connection successful");
        }
    });

    const response = await select("SELECT * FROM auth");
    const current_users = response.map((user) => user.username);
    const name_taken = current_users.includes(req.body.new_username);

    console.log(name_taken);
    console.log(current_users);

    if (!name_taken) {
        await insert("INSERT INTO auth (username, password) VALUES ($1, $2)", [
            req.body.new_username,
            req.body.new_password,
        ]);
    }

    db.close();

    res.render("index.ejs", {
        name_taken: name_taken,
        username: req.body.new_username,
    });
});

app.post("/login", async (req, res) => {
    const db = new sqlite3.Database("./data/stalker.db", (err) => {
        if (err) {
            console.log("Could not connect to database");
        } else {
            console.log("Connection successful");
        }
    });

    /* authentication */

    const user = await select("SELECT * FROM auth WHERE username = $1", [
        req.body.username,
    ]);

    let exists = false;

    console.log(user);

    if (user[0].password == req.body.password) {
        /* directs to user page */

        /* check for user profile information */

        const user_check = await select("SELECT * FROM profile");

        for (let i = 0; i < user_check.length; i++) {
            if (user_check[i].username.includes(req.body.username)) {
                exists = true;
            }
        }

        /* profile setup */

        var startQuestion = false;

        /* pass username incase of setup */

        const username = req.body.username;
        req.session.username = username;

        const pref = req.body.selection;
        req.session.selection = pref;
        console.log("username-saved", { username }, "selection-saved", { pref });

        /* insert data into profile table as needed */

            if (exists === true) {
                const profile = await select(
                    "SELECT * FROM profile WHERE username = ($1)",
                    [req.body.username]
                );

                if (profile[0].stock_pref !== null) {
                    const preferred_stocks = await slowSelect(
                        25000,
                        profile[0].stock_pref.toLowerCase()
                    );

                    /* filter options config */

                    let countries = [];
                    let exchanges = [];
                    let currencies = [];
                    let currency_base = [];
                    let currency_quote = [];
                    let currency_group = [];

                    if (
                        profile[0].stock_pref === "Equities" ||
                        profile[0].stock_pref === "Index" ||
                        profile[0].stock_pref === "ETFs"
                    ) {
                        for (let i = 0; i < preferred_stocks.length; i++) {
                            countries.push(preferred_stocks[i].country);
                            exchanges.push(preferred_stocks[i].exchange);
                            currencies.push(preferred_stocks[i].currency);
                        }

                        countries = [...new Set(countries)];
                        currencies = [...new Set(currencies)];
                        exchanges = [...new Set(exchanges)];
                    } else if (profile[0].stock_pref === "Crypto") {
                        for (let i = 0; i < preferred_stocks.length; i++) {
                            currency_base.push(preferred_stocks[i].currency_base);
                            currency_quote.push(preferred_stocks[i].currency_quote);
                        }

                        currency_base = [...new Set(currency_base)];
                        currency_quote = [...new Set(currency_quote)];
                    } else if (profile[0].stock_pref === "Forex") {
                        for (let i = 0; i < preferred_stocks.length; i++) {
                            currency_base.push(preferred_stocks[i].currency_base);
                            currency_group.push(preferred_stocks[i].currency_group);
                        }

                        currency_base = [...new Set(currency_base)];
                        currency_group = [...new Set(currency_group)];
                    }

                    res.render("home.ejs", {
                        profile: profile,
                        setup: startQuestion,
                        preferred_stocks: preferred_stocks,
                        allStocks: allStocks,
                        allQuotes: allQuotes,
                        logos: logos,
                        prices: prices,
                        url: url,
                        currentStocks: currentStocks,
                        countries: countries,
                        currencies: currencies,
                        exchanges: exchanges,
                        currency_quote: currency_quote,
                        currency_base: currency_base,
                        currency_group: currency_group,
                    });
                } else {
                    startQuestion = true;
                    res.render("home.ejs", {
                        profile: profile,
                        setup: startQuestion,
                        preferred_stocks: preferred_stocks,
                        stock_data: stock_data.data,
                        stock_quote: stock_quote.data,
                        logoURL: logoProcess.data.logo,
                        realPrice: realPrice.data.price,
                        url: url,
                        stocks: stocks,
                        countries: countries,
                        currencies: currencies,
                        exchanges: exchanges,
                        currency_quote: currency_quote,
                        currency_base: currency_base,
                        currency_group: currency_group,
                    });
                }

                console.log("yup");
            } else {
                startQuestion = true;

                await insert("INSERT INTO profile (username) VALUES ($1)", [
                    req.body.username,
                ]);

                const profile = await select(
                    "SELECT * FROM profile WHERE username = ($1)",
                    [req.body.username]
                );

                res.render("home.ejs", {
                    profile: profile,
                    setup: startQuestion,
                    preferred_stocks: preferred_stocks,
                    stock_data: stock_data.data,
                    stock_quote: stock_quote.data,
                    logoURL: logoProcess.data.logo,
                    realPrice: realPrice.data.price,
                    url: url,
                    stocks: stocks,
                    countries: countries,
                    currencies: currencies,
                    exchanges: exchanges,
                    currency_quote: currency_quote,
                    currency_base: currency_base,
                    currency_group: currency_group,
                });
            }
    } else {
        /* auth fail */

        check = false;

        res.render("index.ejs", {
            name_taken: name_taken,
            check: check,
            username: req.body.new_username,
        });
    }

    db.close();
});

app.get("/bg-remove", async (req, res) => {
    async function imageProccess(imageURL) {
        try {
            const response = await axios.get(imageURL, {
                responseType: "arraybuffer",
            });

            let image = await sharp(response.data);

            const metadata = await image.metadata();
            const hasAlpha = metadata.hasAlpha;

            if (!hasAlpha) {
                image = image.png({ alphaQuality: -1, force: true });
                console.log("fuckyou");
            }

            const { data, info } = await image
                .ensureAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true });

            for (let i = 0; i < data.length; i += 4) {
                if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) {
                    data[i + 3] = 0;
                }
            }

            const proccessedImage = await sharp(data, { raw: info }).png().toBuffer();

            const proccessedURL = `data:image/png;base64,${proccessedImage.toString(
                "base64"
            )}`;

            return proccessedURL;
        } catch (error) {
            console.log("error processing image", error);
            throw error;
        }
    }

    try {
        const rawURL = req.query.rawURL;

        const logo = await imageProccess(rawURL);

        res.json({ logo: logo });
    } catch (error) {
        console.error("error with request:", error);
        res.status(500);
    }
});

app.get("/stockGen", async (req, res) => {
    const user = await select("SELECT * FROM profile WHERE username = ($1)", [
        req.session.username,
    ]);
    const options = await select(
        `SELECT symbol FROM ${user[0].stock_pref.toLowerCase()}`
    );

    let stocks = [];

    for (let i = 0; i < 5; i++) {
        stocks.push(options[Math.floor(Math.random() * options.length)].symbol);
        i++;
    }

    res.json({ stocks });
});

app.post("/user-setup", async (req, res) => {
    const db = new sqlite3.Database("./data/stalker.db", (err) => {
        if (err) {
            console.log("Could not connect to database");
        } else {
            console.log("Connection successful");
        }
    });

    console.log("request", req.body);

    const username = req.session.username;
    console.log("passed", username);

    const pref = req.body.selection;
    console.log(pref);

    var startQuestion = false;

    /* insert form data */

        console.log(req.body.name);

    const update = await insert(
        "UPDATE profile SET name = $1, stock_pref = $2 WHERE username = $3 ",
        [req.body.name, pref, username]
    );

    /* grab user profile */

        const profile = await select("SELECT * FROM profile WHERE username = ($1)", [
            username,
        ]);

    const preferred_stocks = await select(
        `SELECT * FROM ${profile[0].stock_pref.toLowerCase()}`
    );

    /* filter options config */

        let countries = [];
    let exchanges = [];
    let currencies = [];
    let currency_base = [];
    let currency_quote = [];
    let currency_group = [];

    if (
        profile[0].stock_pref === "Equities" ||
        profile[0].stock_pref === "Index" ||
        profile[0].stock_pref === "ETFs"
    ) {
        for (let i = 0; i < preferred_stocks.length; i++) {
            countries.push(preferred_stocks[i].country);
            exchanges.push(preferred_stocks[i].exchange);
            currencies.push(preferred_stocks[i].currency);
        }

        countries = [...new Set(countries)];
        currencies = [...new Set(currencies)];
        exchanges = [...new Set(exchanges)];
    } else if (profile[0].stock_pref === "Crypto") {
        for (let i = 0; i < preferred_stocks.length; i++) {
            currency_base.push(preferred_stocks[i].currency_base);
            currency_quote.push(preferred_stocks[i].currency_quote);
        }

        currency_base = [...new Set(currency_base)];
        currency_quote = [...new Set(currency_quote)];
    } else if (profile[0].stock_pref === "Forex") {
        for (let i = 0; i < preferred_stocks.length; i++) {
            currency_base.push(preferred_stocks[i].currency_base);
            currency_group.push(preferred_stocks[i].currency_group);
        }

        currency_base = [...new Set(currency_base)];
        currency_group = [...new Set(currency_group)];
    }

    console.log(profile[0]);

    res.render("home.ejs", {
        profile: profile,
        setup: startQuestion,
        preferred_stocks: preferred_stocks,
        currencies: currencies,
        exchanges: exchanges,
        countries: countries,
        currency_base: currency_base,
        currency_group: currency_group,
        currency_quote: currency_quote,
    });

    db.close();
});

app.listen(3000, () => {
    console.log(`Server running on port ${port}.`);
});
