import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { serializeUser } from "../utils/serializers.js";
import { signToken } from "../utils/jwt.js";

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const normalizedUsername = String(username || "").trim().toLowerCase();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  const exists = await User.findOne({ $or: [{ username: normalizedUsername }, { email: normalizedEmail }] });
  if (exists) return res.status(409).json({ message: "Username or email is already in use" });

  const user = await User.create({ username: normalizedUsername, email: normalizedEmail, password });
  const token = signToken({ id: String(user._id), username: user.username });
  res.status(201).json({ token, user: serializeUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || "").trim().toLowerCase() }).select("+password");
  if (!user || !(await (user as any).comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = signToken({ id: String(user._id), username: user.username });
  res.json({ token, user: serializeUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: serializeUser(user) });
});
