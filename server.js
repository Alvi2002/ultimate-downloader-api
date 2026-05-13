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
        // TIKTOK
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
        // FACEBOOK
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
        // INSTAGRAM (GRABGRAM API STYLE)
        // ==================================================

        if (url.includes("instagram.com")) {
            try {
                // SEND REQUEST TO GRABGRAM
                const response = await fetch("https://grabgram.io/reels-download", {
                    method: "POST",
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                        "user-agent": "Mozilla/5.0"
                    },
                    body: `url=${encodeURIComponent(url)}`
                });

                const html = await response.text();

                // FIND MP4 LINK
                const match = html.match(/(https?:\/\/[^"' ]+\.mp4[^"' ]*)/i);

                if (match && match[1]) {
                    return res.json({
                        status: true,
                        platform: "Instagram",
                        data: {
                            title: "Instagram Reel",
                            video: match[1]
                        }
                    });
                }
            } catch (e) {}

            // FALLBACK yt-dlp
            const video = await run(
                `yt-dlp -f "bv*+ba/best" --no-check-certificate --get-url "${url}"`
            );

            if (!video) {
                return res.json({
                    status: false,
                    platform: "Instagram",
                    message: "Instagram download failed"
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

// ======================================================
// PORT
// ======================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🥏 Ultimate Downloader API Running on ${PORT}`);
});
