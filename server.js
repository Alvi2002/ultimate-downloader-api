// ======================================================
// ULTIMATE JSON MULTI PLATFORM DOWNLOADER API
// ======================================================

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { exec } from "child_process";
import fs from "fs";

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
        message: "Ultimate JSON Downloader API Running"
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
        // TIKTOK
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
        // YOUTUBE
        // ==================================================

        if (
            url.includes("youtube.com") ||
            url.includes("youtu.be")
        ) {

            try {

                const response = await fetch(
                    `https://api.agatz.xyz/api/ytmp4?url=${encodeURIComponent(url)}`
                );

                const json = await response.json();

                return res.json({
                    status: true,
                    platform: "YouTube",
                    data: {
                        title: json.data.title,
                        video: json.data.downloadUrl,
                        thumbnail: json.data.thumbnail
                    }
                });

            } catch {

                return res.json({
                    status: false,
                    platform: "YouTube",
                    message: "YouTube downloader failed"
                });

            }

        }

        // ==================================================
        // INSTAGRAM / FACEBOOK
        // USING YT-DLP
        // ==================================================

        const fileName = `video_${Date.now()}.mp4`;

        const command =
            `yt-dlp -f "best[ext=mp4]" --get-url "${url}"`;

        exec(command, async (error, stdout) => {

            if (error) {

                return res.status(500).json({
                    status: false,
                    message: "yt-dlp failed",
                    error: error.toString()
                });

            }

            const videoUrl = stdout.trim();

            if (!videoUrl) {

                return res.status(500).json({
                    status: false,
                    message: "No direct video URL found"
                });

            }

            let platform = "Unknown";

            if (url.includes("instagram.com")) {
                platform = "Instagram";
            }

            if (
                url.includes("facebook.com") ||
                url.includes("fb.watch")
            ) {
                platform = "Facebook";
            }

            return res.json({
                status: true,
                platform: platform,
                data: {
                    title: `${platform} Video`,
                    video: videoUrl
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
