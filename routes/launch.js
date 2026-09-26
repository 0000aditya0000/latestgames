const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const pool = require("../db");
const { encrypt } = require("../encryption");
require("dotenv").config();

const router = express.Router();

router.get("/", async (req, res) => {

    try {

        const { uid, game, sign } = req.query;

        if (!uid || !game || !sign) {
            return res.status(400).send("Missing params");
        }

        // 🔐 Verify signature
        const expectedSign = crypto
            .createHmac("sha256", process.env.LAUNCH_SECRET)
            .update(uid + game)
            .digest("hex");

        if (sign !== expectedSign) {
            return res.status(403).send("Invalid signature");
        }

        // 💰 Fetch INR wallet balance
        const [walletRows] = await pool.query(
            `SELECT balance FROM wallet 
             WHERE userId = ? 
             AND LOWER(cryptoname) = 'inr'
             LIMIT 1`,
            [uid]
        );

        if (!walletRows.length) {
            return res.status(400).send("INR wallet not found");
        }

        const balance = parseFloat(walletRows[0].balance || 0);

        const timestamp = Date.now().toString();

        const payload = {
            agency_uid: process.env.AGENCY_UID,
            member_account: process.env.PLAYER_PREFIX + uid,
            game_uid: game,
            credit_amount: balance.toString(),
            currency_code: "INR",
            language: "en",
            timestamp,
            platform: 1,
            home_url: "https://rollix777.com",
            callback_url: "https://latestgames.rollix777.com/callback"
        };

        const encrypted = encrypt(payload);

        const response = await axios.post(
            process.env.SERVER_URL + "/game/v1",
            {
                agency_uid: process.env.AGENCY_UID,
                timestamp,
                payload: encrypted
            }
        );


 console.log("vendor response",response.data);       
 const gameUrl = response.data.payload.game_launch_url;

        return res.redirect(gameUrl);

    } catch (error) {
        console.log(error);
        return res.status(500).send("Launch error");
    }
});

module.exports = router;
