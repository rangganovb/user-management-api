import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { findByEmail, createUser } from "../models/userModel.js";
dotenv.config();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (password) =>
  typeof password === "string" && password.length >= 8;

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res
        .status(400)
        .json({ message: "Semua input harus berupa teks (string)" });
    }

    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ message: "Format email tidak valid (harus user@domain.com)" });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ message: "Password minimal 8 karakter" });
    }

    const existing = await findByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await createUser(username, email, hashed);

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error registering user", error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Format email tidak valid" });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ message: "Password minimal 8 karakter" });
    }

    const user = await findByEmail(email);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: "Email atau password salah" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    res.json({ message: "Login berhasil", token });
  } catch (err) {
    res.status(500).json({ message: "Login gagal", error: err.message });
  }
};
