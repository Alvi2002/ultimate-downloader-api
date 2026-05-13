// ======================================================
// ULTIMATE JSON MULTI PLATFORM DOWNLOADER API (FIXED)
// ======================================================

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
        status: true,
        developer: "Alvi Ahmed",
        message: "🥏 Ultimate Downloader API"
    });

});

// ======================================================
// MAIN DOWNLOADER
// ======================================================

app.get("/down", async (req, res) => {

    const url = req.query.url;

    if (!url) {

        return res.status(400).json({
            status: false,
            message: "No URL Provided"
        });
    }

    try {

        // ==================================================
        // TIKTOK (UNCHANGED - 100% WORKING)
        // ==================================================

        if (
            url.includes("tiktok.com") ||
            url.includes("vt.tiktok.com")
        ) {

            const response = await fetch(
                `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`
            );

            const json = await response.json();

            if (json.data) {

                return res.json({
                    status: true,
                    platform: "TikTok",
                    data: {
                        title: json.data.title,
                        video: json.data.play,
                        music: json.data.music,
                        thumbnail: json.data.cover,
                        author: json.data.author?.nickname
                    }
                });
            }
        }

        // ==================================================
        // YOUTUBE (FIXED + MULTI FALLBACK)
        // ==================================================

        if (
            url.includes("youtube.com") ||
            url.includes("youtu.be")
        ) {

            try {

                // -------------------------
                // API FALLBACK
                // -------------------------
                const response = await fetch(
                    `https://api.vevioz.com/api/button/mp4?url=${encodeURIComponent(url)}`
                );

                const text = await response.text();

                if (!text.startsWith("<!DOCTYPE")) {

                    const json = JSON.parse(text);

                    return res.json({
                        status: true,
                        platform: "YouTube",
                        data: {
                            title: json.title || "YouTube Video",
                            video: json.url
                        }
                    });
                }

            } catch (e) {}

            // -------------------------
            // YT-DLP FALLBACK
            // -------------------------

            const command =
                `yt-dlp --no-warnings --no-check-certificate -f "bv*+ba/best" --get-url "${url}"`;

            exec(command, (error, stdout) => {

                if (error || !stdout) {

                    return res.json({
                        status: false,
                        platform: "YouTube",
                        message: "YouTube download failed (blocked by platform)"
                    });
                }

                return res.json({
                    status: true,
                    platform: "YouTube",
                    data: {
                        title: "YouTube Video",
                        video: stdout.trim()
                    }
                });
            });

            return;
        }

        // ==================================================
        // INSTAGRAM (FIXED + MULTI FALLBACK)
        // ==================================================

        if (url.includes("instagram.com")) {

            let platform = "Instagram";

            try {

                // -------------------------
                // API FALLBACK (SAVETUBE)
                // -------------------------
                const api = await fetch(
                    `https://api.savetube.me/api/instagram?url=${encodeURIComponent(url)}`
                );

                const json = await api.json();

                if (json?.data?.url) {

                    return res.json({
                        status: true,
                        platform: platform,
                        data: {
                            title: "Instagram Video",
                            video: json.data.url,
                            thumbnail: json.data.thumbnail || null
                        }
                    });
                }

            } catch (e) {}

            // -------------------------
            // YT-DLP FALLBACK
            // -------------------------

            const command =
                `yt-dlp --no-warnings --no-check-certificate -f "bv*+ba/best" --get-url "${url}"`;

            exec(command, (error, stdout) => {

                if (error || !stdout) {

                    return res.json({
                        status: false,
                        platform: platform,
                        message: "Instagram video blocked or private"
                    });
                }

                return res.json({
                    status: true,
                    platform: platform,
                    data: {
                        title: "Instagram Reel",
                        video: stdout.trim()
                    }
                });
            });

            return;
        }

        // ==================================================
        // FACEBOOK (UNCHANGED - WORKING)
        // ==================================================

        let platform = "Facebook";

        const command =
            `yt-dlp --no-warnings --no-check-certificate -f "best[ext=mp4]" --get-url "${url}"`;

        exec(command, (error, stdout) => {

            if (error || !stdout) {

                return res.json({
                    status: false,
                    platform: platform,
                    message: "Facebook download failed"
                });
            }

            return res.json({
                status: true,
                platform: platform,
                data: {
                    title: "Facebook Video",
                    video: stdout.trim()
                }
            });
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

    console.log(`Server Running On Port ${PORT}`);
});
