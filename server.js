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

        if (
            url.includes("tiktok.com") ||
            url.includes("vt.tiktok.com")
        ) {

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

        if (
            url.includes("facebook.com") ||
            url.includes("fb.watch")
        ) {

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
        // INSTAGRAM (HYBRID API + FALLBACK)
        // ==================================================

        if (url.includes("instagram.com")) {

            // -------------------------
            // API 1
            // -------------------------
            try {

                const api = await fetch(
                    `https://api.savetube.me/api/instagram?url=${encodeURIComponent(url)}`
                );

                const json = await api.json();

                if (json?.data?.url) {

                    return res.json({
                        status: true,
                        platform: "Instagram",
                        data: {
                            title: "Instagram Video",
                            video: json.data.url
                        }
                    });
                }

            } catch (e) {}

            // -------------------------
            // API 2 fallback
            // -------------------------
            try {

                const api2 = await fetch(
                    `https://api.sssinstagram.com/api/convert?url=${encodeURIComponent(url)}`
                );

                const json2 = await api2.json();

                if (json2?.url) {

                    return res.json({
                        status: true,
                        platform: "Instagram",
                        data: {
                            title: "Instagram Video",
                            video: json2.url
                        }
                    });
                }

            } catch (e) {}

            // -------------------------
            // YT-DLP fallback (NO COOKIES)
            // -------------------------

            const video = await run(
                `yt-dlp -f "bv*+ba/best" --no-check-certificate --get-url "${url}"`
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
        // YOUTUBE (HYBRID SYSTEM)
        // ==================================================

        if (
            url.includes("youtube.com") ||
            url.includes("youtu.be")
        ) {

            // -------------------------
            // API 1
            // -------------------------
            try {

                const api = await fetch(
                    `https://api.vevioz.com/api/button/mp4?url=${encodeURIComponent(url)}`
                );

                const text = await api.text();

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
            // API 2 fallback
            // -------------------------
            try {

                const api2 = await fetch(
                    `https://api.agatz.xyz/api/ytmp4?url=${encodeURIComponent(url)}`
                );

                const json2 = await api2.json();

                if (json2?.data?.downloadUrl) {

                    return res.json({
                        status: true,
                        platform: "YouTube",
                        data: {
                            title: json2.data.title || "YouTube Video",
                            video: json2.data.downloadUrl
                        }
                    });
                }

            } catch (e) {}

            // -------------------------
            // YT-DLP fallback (SAFE)
            // -------------------------

            const video = await run(
                `yt-dlp -f "bv*+ba/best" --no-check-certificate --get-url "${url}"`
            );

            if (!video) {

                return res.json({
                    status: false,
                    platform: "YouTube",
                    message: "YouTube blocked or unavailable"
                });
            }

            return res.json({
                status: true,
                platform: "YouTube",
                data: {
                    title: "YouTube Video",
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

    console.log(`Hybrid API Running on ${PORT}`);
});
