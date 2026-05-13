// ======================================================
// ULTIMATE MULTI PLATFORM DOWNLOADER API
// RENDER + EXPRESS + YT-DLP READY
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
        message: "Ultimate Downloader API Running"
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
        // YOUTUBE / INSTAGRAM / FACEBOOK
        // USING YT-DLP
        // ==================================================

        const fileName = `video_${Date.now()}.mp4`;

        const command = `yt-dlp -f mp4 -o "${fileName}" "${url}"`;

        exec(command, async (error) => {

            if (error) {

                return res.status(500).json({
                    status: false,
                    message: "yt-dlp download failed",
                    error: error.toString()
                });

            }

            // ==============================================
            // FILE CHECK
            // ==============================================

            if (!fs.existsSync(fileName)) {

                return res.status(500).json({
                    status: false,
                    message: "Downloaded file missing"
                });

            }

            // ==============================================
            // SEND FILE
            // ==============================================

            res.download(fileName, () => {

                // DELETE FILE AFTER DOWNLOAD
                fs.unlinkSync(fileName);

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
