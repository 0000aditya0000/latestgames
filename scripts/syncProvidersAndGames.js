const axios = require("axios");
const mysql = require("mysql2/promise");
require("dotenv").config();

// DB connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5
});

const BASE_URL = process.env.SERVER_URL;
const AGENCY_UID = process.env.AGENCY_UID;

async function syncProvidersAndGames() {
    try {
        console.log("🔄 Fetching providers...");

        // 1️⃣ Fetch providers
        const providerRes = await axios.get(`${BASE_URL}/game/providers`, {
            params: {
                agency_uid: AGENCY_UID,
                currency: "INR",
                lang: "en"
            },
            timeout: 20000
        });

        if (!providerRes.data || !Array.isArray(providerRes.data.data)) {
            throw new Error("Invalid provider response");
        }

        const providers = providerRes.data.data;

        for (const p of providers) {

            // 2️⃣ Store provider
            await db.query(
                `INSERT INTO game_providers
                (provider_code, provider_name, currency, language, status)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    provider_name = VALUES(provider_name),
                    currency = VALUES(currency),
                    language = VALUES(language),
                    status = VALUES(status)`,
                [
                    p.code,
                    p.name,
                    p.currency || "",
                    p.lang || "",
                    p.status ?? 0
                ]
            );

            console.log(`📦 Provider synced: ${p.code}`);

            // 3️⃣ Fetch games for provider
            let gameRes;
            try {
                gameRes = await axios.get(`${BASE_URL}/game/list`, {
                    params: {
                        agency_uid: AGENCY_UID,
                        code: p.code,
                        currency: "INR",
                        lang: "en"
                    },
                    timeout: 30000
                });
            } catch (err) {
                console.warn(`⚠️ Failed to fetch games for provider: ${p.code}`);
                continue;
            }

            const games = gameRes?.data?.data;

            // 4️⃣ Defensive check
            if (!Array.isArray(games) || games.length === 0) {
                console.warn(`⚠️ No games for provider: ${p.code}`);
                continue;
            }

            // 5️⃣ Store games
            for (const g of games) {

                if (!g.game_uid) continue;

                await db.query(
                    `INSERT INTO games
                    (provider_code, game_uid, game_name, game_type, currency, language, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        game_name = VALUES(game_name),
                        game_type = VALUES(game_type),
                        currency = VALUES(currency),
                        language = VALUES(language),
                        status = VALUES(status)`,
                    [
                        p.code,
                        g.game_uid,
                        g.game_name || "",
                        g.game_type || "",
                        g.currency || "",
                        g.lang || "",
                        g.status ?? 0
                    ]
                );
            }

            console.log(`🎮 Games synced for provider: ${p.code} (${games.length})`);
        }

        console.log("✅ ALL providers & games synced successfully");

    } catch (error) {
        console.error("❌ Sync failed:", error.message);
    } finally {
        process.exit(0);
    }
}

// Run
syncProvidersAndGames();
