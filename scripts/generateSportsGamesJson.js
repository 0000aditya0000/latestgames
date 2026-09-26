const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: "/var/www/latestgames/.env" });

// DB connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5
});

async function generateSportsJson() {
    try {
        console.log("🔄 Generating sports games JSON...");

        const [rows] = await db.query(`
            SELECT
                g.game_uid AS id,
                g.game_name AS name,
                gp.provider_name AS title
            FROM games g
            JOIN game_providers gp
                ON g.provider_code = gp.provider_code
            WHERE g.status = 1
              AND LOWER(g.game_type) LIKE '%sport%'
        `);

        const result = rows.map(row => ({
            id: row.id,
            name: row.name,
            img: "",
            title: row.title
        }));

        const outputDir = "/var/www/latestgames/data";
        const outputFile = path.join(outputDir, "sports_games.json");

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(
            outputFile,
            JSON.stringify(result, null, 2),
            "utf8"
        );

        console.log(`✅ JSON file created: ${outputFile}`);
        console.log(`🏟️ Total sports games: ${result.length}`);

    } catch (err) {
        console.error("❌ Failed to generate sports JSON:", err.message);
    } finally {
        process.exit(0);
    }
}

// Run
generateSportsJson();
