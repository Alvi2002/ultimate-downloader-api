import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// HOME
app.get("/", (req, res) => {
    res.json({
        Status: true,
        Developer: "Alvi Ahmed",
        Message: "🥏 Ultimate Downloader Engine Active"
    });
});

// Helper 1: ফেসবুকের /share/r/ বা শর্ট লিঙ্ককে আসল লিঙ্কে রূপান্তর
async function getFinalUrl(url) {
    try {
        const response = await fetch(url, {
            method: "GET",
            redirect: "follow",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        return response.url || url;
    } catch {
        return url;
    }
}

// Helper 2: HTML Entity Decode
function decodeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
}

// ======================================================
// 1. FACEBOOK EXTRACTOR ENGINE
// ======================================================
async function getFacebookVideo(fbUrl) {
    const targetUrl = await getFinalUrl(fbUrl);

    // মেথড ১: FDOWN ইঞ্জিন (Direct Extraction)
    try {
        const res = await fetch("https://fdown.net/download.php", {
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            body: `URL=${encodeURIComponent(targetUrl)}`
        });
        const html = await res.text();

        const hdMatch = html.match(/id="hdlink"\s+href="([^"]+)"/i);
        const sdMatch = html.match(/id="sdlink"\s+href="([^"]+)"/i);

        const videoUrl = hdMatch ? decodeHtml(hdMatch[1]) : (sdMatch ? decodeHtml(sdMatch[1]) : null);
        if (videoUrl && videoUrl.includes("http")) {
            return videoUrl;
        }
    } catch (e) {}

    // মেথড ২: ফেসবুক ডিরেক্ট HTML স্ক্র্যাপার (playable_url / browser_native_hd_url)
    try {
        const pageRes = await fetch(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        const pageHtml = await pageRes.text();
        const unescaped = pageHtml.replace(/\\/g, "");

        const streamMatch = unescaped.match(/"(browser_native_hd_url|playable_url_quality_hd|browser_native_sd_url|playable_url)":"(https:[^"]+)"/i);
        if (streamMatch && streamMatch[2]) {
            return streamMatch[2];
        }
    } catch (e) {}

    return null;
}

// ======================================================
// 2. INSTAGRAM EXTRACTOR ENGINE
// ======================================================
async function getInstagramVideo(igUrl) {
    // পোস্ট বা রিলের আইডি (shortcode) বের করা
    const codeMatch = igUrl.match(/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
    const shortcode = codeMatch ? codeMatch[1] : null;

    if (!shortcode) return null;

    // মেথড ১: InstagramEZ / InstaFix ইঞ্জিন
    try {
        const fixUrl = `https://instagramez.com/reel/${shortcode}/`;
        const res = await fetch(fixUrl, {
            headers: {
                "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"
            }
        });
        const html = await res.text();
        const match = html.match(/<meta\s+(?:property|name)=["'](?:og:video(?::secure_url)?|twitter:player:stream)["']\s+content=["']([^"']+)["']/i);
        if (match && match[1] && match[1].includes(".mp4")) {
            return decodeHtml(match[1]);
        }
    } catch (e) {}

    // মেথড ২: Instagram Official Embed Scraper
    try {
        const embedUrl = `https://www.instagram.com/reel/${shortcode}/embed/captioned/`;
        const res = await fetch(embedUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        const html = await res.text();

        // embed পৃষ্ঠার ভেতরের ডিরেক্ট mp4 বা video_url খোঁজা
        const videoMatch = html.match(/"video_url":"([^"]+)"/i) || html.match(/(https:\/\/[^"'\s]*?cdninstagram\.com[^"'\s]*?\.mp4[^"'\s]*)/i);
        if (videoMatch && videoMatch[1]) {
            return decodeHtml(videoMatch[1].replace(/\\u0026/g, "&").replace(/\\/g, ""));
        }
    } catch (e) {}

    // মেথড ৩: DDInstagram ফলব্যাক
    try {
        const ddUrl = `https://ddinstagram.com/reel/${shortcode}/`;
        const res = await fetch(ddUrl, {
            headers: {
                "User-Agent": "TelegramBot (like TwitterBot)"
            }
        });
        const html = await res.text();
        const match = html.match(/<meta[^>]+property=["']og:video["'][^>]+content=["']([^"']+)["']/i);
        if (match && match[1]) {
            return decodeHtml(match[1]);
        }
    } catch (e) {}

    return null;
}

// ======================================================
// MAIN API ROUTE
// ======================================================
app.get("/down", async (req, res) => {
    const rawUrl = req.query.url;

    if (!rawUrl) {
        return res.json({
            status: false,
            message: "No URL provided"
        });
    }

    try {
        // --------------------------------------------------
        // TIKTOK
        // --------------------------------------------------
        if (rawUrl.includes("tiktok.com")) {
            const api = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(rawUrl)}`);
            const json = await api.json();

            if (json?.data?.play) {
                return res.json({
                    status: true,
                    platform: "TikTok",
                    data: {
                        title: json.data.title || "TikTok Video",
                        video: json.data.play,
                        music: json.data.music,
                        thumbnail: json.data.cover
                    }
                });
            }
            return res.json({ status: false, platform: "TikTok", message: "TikTok download failed" });
        }

        // --------------------------------------------------
        // FACEBOOK
        // --------------------------------------------------
        if (rawUrl.includes("facebook.com") || rawUrl.includes("fb.watch")) {
            const videoUrl = await getFacebookVideo(rawUrl);

            if (videoUrl) {
                return res.json({
                    status: true,
                    platform: "Facebook",
                    data: {
                        title: "Facebook Video",
                        video: videoUrl
                    }
                });
            }

            return res.json({
                status: false,
                platform: "Facebook",
                message: "Facebook download failed"
            });
        }

        // --------------------------------------------------
        // INSTAGRAM
        // --------------------------------------------------
        if (rawUrl.includes("instagram.com")) {
            const videoUrl = await getInstagramVideo(rawUrl);

            if (videoUrl) {
                return res.json({
                    status: true,
                    platform: "Instagram",
                    data: {
                        title: "Instagram Reel",
                        video: videoUrl
                    }
                });
            }

            return res.json({
                status: false,
                platform: "Instagram",
                message: "Instagram download failed"
            });
        }

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

// LISTEN
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
