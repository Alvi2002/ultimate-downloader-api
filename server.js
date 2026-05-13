import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { exec } from "child_process";

const app = express();

app.use(cors());
app.use(express.json());

// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {
    res.json({
        Status: true,
        Developer: "Alvi Ahmed",
        Message: "🥏 Ultimate Downloader"
    });
});

// ======================================================
// SAFE EXEC WRAPPER
// ======================================================

function run(cmd) {
    return new Promise((resolve) => {
        exec(cmd, { timeout: 20000 }, (err, stdout) => {
            if (err) return resolve(null);
            resolve(stdout?.trim());
        });
    });
}

// ======================================================
// MAIN API
// ======================================================

app.get("/down", async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.json({
            status: false,
            message: "No URL provided"
        });
    }

    try {
        // ==================================================
        // TIKTOK (UNCHANGED - 100%)
        // ==================================================

        if (url.includes("tiktok.com") || url.includes("vt.tiktok.com")) {
            const api = await fetch(
                `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`
            );
            const json = await api.json();

            if (json.data) {
                return res.json({
                    status: true,
                    platform: "TikTok",
                    data: {
                        title: json.data.title,
                        video: json.data.play,
                        music: json.data.music,
                        thumbnail: json.data.cover
                    }
                });
            }
        }

        // ==================================================
        // FACEBOOK (UNCHANGED)
        // ==================================================

        if (url.includes("facebook.com") || url.includes("fb.watch")) {
            const video = await run(
                `yt-dlp -f "best[ext=mp4]" --get-url "${url}"`
            );

            if (!video) {
                return res.json({
                    status: false,
                    platform: "Facebook",
                    message: "Facebook download failed"
                });
            }

            return res.json({
                status: true,
                platform: "Facebook",
                data: {
                    title: "Facebook Video",
                    video
                }
            });
        }

        // ==================================================
        // INSTAGRAM (API SCRAPER METHOD)
        // ==================================================

        if (url.includes("instagram.com")) {
            try {
                // এপিআই মেথড ব্যবহার করে ভিডিও লিঙ্ক খোঁজা
                const response = await fetch("https://snapinsta.app/action/api/get-media", {
                    method: "POST",
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                    },
                    body: `url=${encodeURIComponent(url)}`
                });

                const data = await response.json();

                if (data && data.url) {
                    return res.json({
                        status: true,
                        platform: "Instagram",
                        data: {
                            title: "Instagram Video",
                            video: data.url
                        }
                    });
                }
            } catch (e) {}

            // FALLBACK yt-dlp (কুকি ছাড়া)
            const video = await run(
                `yt-dlp --user-agent "Mozilla/5.0" --no-check-certificate --get-url "${url}"`
            );

            if (!video) {
                return res.json({
                    status: false,
                    platform: "Instagram",
                    message: "Instagram video not available"
                });
            }

            return res.json({
                status: true,
                platform: "Instagram",
                data: {
                    title: "Instagram Video",
                    video
                }
            });
        }

        // ==================================================
        // UNSUPPORTED
        // ==================================================

        return res.json({
            status: false,
            message: "Unsupported platform"
        });

    } catch (e) {
        return res.status(500).json({
            status: false,
            message: "Server Error",
            error: e.toString()
        });
    }
});

// ==================================================
// PORT
// ==================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🥏 Ultimate Downloader API Running on ${PORT}`);
});
