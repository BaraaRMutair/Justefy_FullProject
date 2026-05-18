const pool = require('../config/db');

/**
 * جلب آخر الرسائل للمستخدم
 */
const getLastMessagesByUser = async (userId, limit = 10) => {
  try {

    const query = `
      SELECT message, sender
      FROM chat_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);

    // ✅ رجع raw format فقط
    return result.rows.reverse().map((msg) => ({
      role: msg.sender,
      content: msg.message
    }));

  } catch (error) {

    console.error("❌ History Fetch Error:", error.message);

    return [];
  }
};

/**
 * حفظ رسالة
 */
const saveMessage = async (userId, message, sender) => {
  try {

    const query = `
      INSERT INTO chat_history (user_id, message, sender)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      message,
      sender
    ]);

    return {
      ok: true,
      data: result.rows[0]
    };

  } catch (error) {

    console.error("❌ History Save Error:", error.message);

    return {
      ok: false,
      error: error.message
    };
  }
};

module.exports = {
  getLastMessagesByUser,
  saveMessage
};