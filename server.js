import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// ======================================================
// HOME ROUTE
// ======================================================
app.get("/", (req, res) => {
    res.json({
        Status: true,
        Developer: "Alvi Ahmed",
        Message: "🥏 Ultimate Downloader API is Running"
    });
});

// Helper: ফেসবুকের শর্ট-রিডিরেক্ট লিংক আসল লিংকে কনভার্ট করার জন্য
async function getFinalUrl(url) {
    try {
        const res = await fetch(url, {
            redirect: "follow",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        return res.url || url;
    } catch {
        return url;
    }
}

// ======================================================
// MAIN DOWNLOAD API
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
        // ১. TIKTOK
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
        // ২. FACEBOOK
        // --------------------------------------------------
        if (rawUrl.includes("facebook.com") || rawUrl.includes("fb.watch")) {
            const targetUrl = await getFinalUrl(rawUrl);

            // API মেথড ১: Snap Engine
            try {
                const fbRes = await fetch(`https://api.vkrdownloader.xyz/server?vkr=${encodeURIComponent(targetUrl)}`);
                const fbData = await fbRes.json();
                const video = fbData?.data?.downloadUrl || fbData?.data?.videos?.[0]?.url;

                if (video) {
                    return res.json({
                        status: true,
                        platform: "Facebook",
                        data: {
                            title: fbData.data.title || "Facebook Video",
                            video: video
                        }
                    });
                }
            } catch (e) {}

            // API মেথড ২: Cobalt ইঞ্জিন ফলব্যাক
            try {
                const altRes = await fetch("https://cobalt-api.kwiatekm.tokyo/", {
                    method: "POST",
                    headers: { "Accept": "application/json", "Content-Type": "application/json" },
                    body: JSON.stringify({ url: targetUrl })
                });
                const altData = await altRes.json();
                if (altData.url) {
                    return res.json({
                        status: true,
                        platform: "Facebook",
                        data: {
                            title: "Facebook Video",
                            video: altData.url
                        }
                    });
                }
            } catch (e) {}

            return res.json({
                status: false,
                platform: "Facebook",
                message: "Facebook download failed"
            });
        }

        // --------------------------------------------------
        // ৩. INSTAGRAM
        // --------------------------------------------------
        if (rawUrl.includes("instagram.com")) {
            // ট্র্যাকিং কোড বাদ দিয়ে ফ্রেশ লিঙ্ক নেওয়া
            const cleanUrl = rawUrl.split("?")[0];

            // API মেথড ১: VKR ডিরেক্ট
            try {
                const igRes = await fetch(`https://api.vkrdownloader.xyz/server?vkr=${encodeURIComponent(cleanUrl)}`);
                const igData = await igRes.json();
                const video = igData?.data?.downloadUrl || igData?.data?.videos?.[0]?.url;

                if (video) {
                    return res.json({
                        status: true,
                        platform: "Instagram",
                        data: {
                            title: igData.data.title || "Instagram Reel",
                            video: video
                        }
                    });
                }
            } catch (e) {}

            // API মেথড ২: Cobalt ইঞ্জিন ফলব্যাক
            try {
                const cobaltRes = await fetch("https://cobalt-api.kwiatekm.tokyo/", {
                    method: "POST",
                    headers: { "Accept": "application/json", "Content-Type": "application/json" },
                    body: JSON.stringify({ url: cleanUrl })
                });
                const cobaltData = await cobaltRes.json();
                if (cobaltData.url) {
                    return res.json({
                        status: true,
                        platform: "Instagram",
                        data: {
                            title: "Instagram Reel",
                            video: cobaltData.url
                        }
                    });
                }
            } catch (e) {}

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

// ======================================================
// LISTEN
// ======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
