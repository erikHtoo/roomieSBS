const supabase = require('../supabaseClient');

async function verifyAuth(req, res, next) {
    try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = user; // later use
    next();
    } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ error: "Unauthorized" });
    }
}

module.exports = {
  verifyAuth
};
