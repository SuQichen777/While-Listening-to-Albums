import express from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { User } from "../models/db.mjs";
import { signToken, requireAuth } from "../middleware/auth.mjs";

const router = express.Router();

// slow down password guessing
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later." },
  skip: () => process.env.NODE_ENV === "test",
});

// compared against when the user does not exist, so both cases take the same time
const dummyHash = bcrypt.hashSync("not a real password", 12);

function publicUser(user) {
  return { id: user._id, username: user.username, email: user.email || "", createDate: user.createDate };
}

// only strings are accepted, { "$ne": null } and friends become ""
function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

router.post("/register", limiter, async (req, res) => {
  const username = text(req.body.username);
  const email = text(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: "Username must be 3-20 letters, numbers or underscores." });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "This is not an email address." });
  }
  // bcrypt only reads the first 72 bytes
  if (password.length < 8 || Buffer.byteLength(password) > 72) {
    return res.status(400).json({ error: "Password must be 8-72 characters." });
  }

  try {
    if (await User.exists({ usernameLower: username.toLowerCase() })) {
      return res.status(409).json({ error: "This username is taken." });
    }
    if (email && await User.exists({ email })) {
      return res.status(409).json({ error: "This email is already registered." });
    }

    const user = await User.create({
      username,
      email: email || undefined,
      passwordHash: await bcrypt.hash(password, 12),
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    if (err.code === 11000) {
      // two registrations at the same moment
      return res.status(409).json({ error: "This username or email is taken." });
    }
    console.error("Error registering:", err);
    res.status(500).json({ error: "Server error registering." });
  }
});

// login is a username or an email
router.post("/login", limiter, async (req, res) => {
  const login = text(req.body.login).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!login || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    const user = await User.findOne(login.includes("@") ? { email: login } : { usernameLower: login }).select("+passwordHash");
    // the same answer for a wrong username and a wrong password
    const matches = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);
    if (!user || !matches) {
      return res.status(401).json({ error: "Wrong username or password." });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Server error logging in." });
  }
});

// who am I, used by the client to restore a session
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
