import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/db.mjs";

let secret = null;

function getSecret() {
  if (!secret) {
    secret = process.env.JWT_SECRET;
    if (!secret) {
      // still works, but every restart logs everyone out
      secret = crypto.randomBytes(32).toString("hex");
      console.warn("JWT_SECRET is not set, using a random one for this run");
    }
  }
  return secret;
}

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, getSecret(), { expiresIn: "7d" });
}

// Authorization: Bearer <token>  ->  req.user
export async function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Please log in first." });
  }
  try {
    const payload = jwt.verify(token, getSecret());
    // look the user up every time, so a deleted user is logged out at once
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Please log in again." });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Please log in again." });
  }
}
