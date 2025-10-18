import pool from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import bcrypt from "bcryptjs";
import {
  findById,
  updateUser,
  deleteUser,
  updateAvatar,
} from "../models/userModel.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (password) =>
  typeof password === "string" && password.length >= 8;

export const getUsers = async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, username, email, role, avatar_url FROM users"
  );
  res.json(rows);
};

// Update profil user sendiri
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const { username, email, password } = req.body;

    // Pastikan hanya bisa ubah profil sendiri
    const targetUser = await findById(id);
    if (!targetUser)
      return res.status(404).json({ message: "User tidak ditemukan" });

    // Validasi data
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

    const hashed = await bcrypt.hash(password, 10);
    const updated = await updateUser(id, username, email, hashed);

    res.json({ message: "Profil berhasil diperbarui", user: updated });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal memperbarui profil", error: err.message });
  }
};

// Delete akun sendiri
export const deleteProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const deleted = await deleteUser(id);
    if (!deleted)
      return res.status(404).json({ message: "User tidak ditemukan" });

    res.json({ message: "Akun berhasil dihapus" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal menghapus akun", error: err.message });
  }
};

// Upload avatar user sendiri
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Tidak ada file diunggah" });
    const { id } = req.user;

    const uploadStream = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "avatars" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const result = await uploadStream();
    const updated = await updateAvatar(id, result.secure_url);

    res.json({ message: "Avatar berhasil diunggah", avatar: updated });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal upload avatar", error: err.message });
  }
};
