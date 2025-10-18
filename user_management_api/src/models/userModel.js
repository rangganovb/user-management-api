import pool from "../config/db.js";

const findByEmail = async (email) => {
  const query = "SELECT * FROM users WHERE email = $1";
  const { rows } = await pool.query(query, [email]);
  return rows[0];
};

const findById = async (id) => {
  const query =
    "SELECT id, username, email, role, avatar_url FROM users WHERE id = $1";
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

const createUser = async (username, email, passwordHash) => {
  const query = `
    INSERT INTO users (username, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, role, avatar_url
  `;
  const { rows } = await pool.query(query, [username, email, passwordHash]);
  return rows[0];
};

const updateUser = async (id, username, email, passwordHash) => {
  const query = `
    UPDATE users
    SET username = $1, email = $2, password = $3, updated_at = NOW()
    WHERE id = $4
    RETURNING id, username, email, role, avatar_url, updated_at
  `;
  const { rows } = await pool.query(query, [username, email, passwordHash, id]);
  return rows[0];
};

const deleteUser = async (id) => {
  const query = "DELETE FROM users WHERE id = $1 RETURNING id";
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

const updateAvatar = async (id, url) => {
  const query = `
    UPDATE users
    SET avatar_url = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING avatar_url, updated_at
  `;
  const { rows } = await pool.query(query, [url, id]);
  return rows[0];
};

export {
  findByEmail,
  findById,
  createUser,
  updateUser,
  deleteUser,
  updateAvatar,
};
