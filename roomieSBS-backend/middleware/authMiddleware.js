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
        error: "Confirm your school email before continuing",
      });
    }

    const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || "")
      .split(",")
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean);
    const emailDomain = user.email?.split("@").pop()?.toLowerCase();

    if (allowedDomains.length && !allowedDomains.includes(emailDomain)) {
      return res.status(403).json({
        success: false,
        error: "Please sign in with your school email address",
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
