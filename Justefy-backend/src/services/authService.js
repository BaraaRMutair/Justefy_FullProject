const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (name, email, password) => {
  // 1. Check if user already exists
  const existingUser = await pool.query(
    `SELECT id FROM users WHERE email = $1`,
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("Email already exists");
  }

  // 2. Stronger hashing
  const hashed = await bcrypt.hash(password, 12);

  // 3. Insert user
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`,
    [name, email, hashed, "user"]
  );

  return result.rows[0];
};

/**
 * LOGIN
 */
const login = async (email, password) => {
  // 1. Get user
  const result = await pool.query(
    `SELECT id, name, email, password, role FROM users WHERE email = $1`,
    [email]
  );

  const user = result.rows[0];

  // 2. Generic error (security best practice)
  if (!user) {
    return null; // don't reveal "email not found"
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return null;
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );


  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  };
};

module.exports = { register, login };