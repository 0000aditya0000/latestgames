const express = require("express");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const launchRoute = require("./routes/launch");
const callbackRoute = require("./routes/callback");

const app = express();
app.use(express.json());

app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 200
}));

app.use("/launch", launchRoute);
app.use("/callback", callbackRoute);

app.listen(process.env.PORT, () => {
    console.log("LatestGames running on port " + process.env.PORT);
});
