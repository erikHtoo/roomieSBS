const supabase = require('../supabaseClient');

async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const [scheme, token] = (authHeader || "").split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired session",
      });
    }

    if (!user.email_confirmed_at) {
      return res.status(403).json({
        success: false,
        error: "Confirm your email before continuing",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth verification failed:", err.message);
    res.status(401).json({ success: false, error: "Authentication failed" });
    }
}

module.exports = {
  verifyAuth
};
