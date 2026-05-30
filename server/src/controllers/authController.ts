import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResetEmail } from "../utils/email.js";
import { serializeUser } from "../utils/serializers.js";
import { generateResetToken, generateSessionToken, hashToken } from "../utils/session.js";
import { forceDisconnect } from "../socket/index.js";

const googleClient = new OAuth2Client(env.googleClientId);

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const normalizedUsername = String(username || "").trim().toLowerCase();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const exists = await User.findOne({ $or: [{ username: normalizedUsername }, { email: normalizedEmail }] });
  if (exists) return res.status(409).json({ message: "Username or email is already in use" });

  const sessionToken = generateSessionToken();
  const user = await User.create({ username: normalizedUsername, email: normalizedEmail, password, sessionToken, authProvider: "local" });
  res.status(201).json({ token: sessionToken, user: serializeUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || "").trim().toLowerCase() }).select("+password");
  if (!user || !(await (user as any).comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Force disconnect old session (single-device enforcement)
  forceDisconnect(String(user._id));

  const sessionToken = generateSessionToken();
  user.sessionToken = sessionToken;
  await user.save({ validateModifiedOnly: true });

  res.json({ token: sessionToken, user: serializeUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user!.id, { sessionToken: null });
  forceDisconnect(req.user!.id);
  res.json({ message: "Logged out" });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: serializeUser(user) });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = await User.findOne({ email });

  // Always return 200 to not reveal if email exists
  if (!user) return res.json({ message: "If that email is registered, a reset link has been sent." });

  const rawToken = generateResetToken();
  user.resetToken = hashToken(rawToken);
  user.resetExpires = new Date(Date.now() + 3600000); // 1 hour
  await user.save({ validateModifiedOnly: true });

  const resetUrl = `${env.resetPasswordUrl}?token=${rawToken}&email=${encodeURIComponent(email)}`;
  await sendResetEmail(email, resetUrl);

  res.json({ message: "If that email is registered, a reset link has been sent." });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, password } = req.body;

  if (!email || !token || !password || password.length < 6) {
    return res.status(400).json({ message: "Email, token, and a password of at least 6 characters are required." });
  }

  const hashedToken = hashToken(token);
  const user = await User.findOne({
    email: String(email).trim().toLowerCase(),
    resetToken: hashedToken,
    resetExpires: { $gt: new Date() }
  }).select("+password");

  if (!user) return res.status(400).json({ message: "Invalid or expired reset token." });

  user.password = password; // pre-save hook hashes it
  user.resetToken = undefined as any;
  user.resetExpires = undefined as any;
  user.sessionToken = undefined as any; // invalidate active session
  await user.save();

  forceDisconnect(String(user._id));
  res.json({ message: "Password reset successfully. Please log in." });
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: "Google ID token is required" });

  const ticket = await googleClient.verifyIdToken({ idToken, audience: env.googleClientId });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) return res.status(400).json({ message: "Invalid Google token" });

  const { sub: googleId, email, name, picture } = payload;

  // Look for existing user by googleId or email
  let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

  if (user) {
    // Link Google account if found by email but no googleId
    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = "google";
    }
  } else {
    // Create new user
    let username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    if (username.length < 3) username = `user_${username}`;

    // Ensure uniqueness
    const taken = await User.findOne({ username });
    if (taken) username = `${username}_${Math.floor(Math.random() * 9000) + 1000}`;

    user = new User({
      username,
      email: email.toLowerCase(),
      googleId,
      authProvider: "google",
      avatar: picture || "",
      bio: name ? `Hi, I'm ${name}!` : "Exploring Global Space."
    });
  }

  // Force disconnect old session
  forceDisconnect(String(user._id));

  const sessionToken = generateSessionToken();
  user.sessionToken = sessionToken;
  await user.save({ validateModifiedOnly: true });

  res.json({ token: sessionToken, user: serializeUser(user) });
});
