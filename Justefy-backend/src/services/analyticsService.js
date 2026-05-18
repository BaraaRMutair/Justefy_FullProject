const pool = require('../config/db');

/**
 * جلب أكثر المستخدمين نشاطاً (Top Users)
 * - يعتمد على عدد الرسائل
 * - يدعم ترتيب + بيانات إضافية
 * - يربط مع جدول users إذا موجود
 */
const getTopUsers = async (limit = 5, days = null) => {
  try {
    let query = `
      SELECT 
        chat_history.user_id,
        COUNT(chat_history.id) AS total_messages,
        MAX(chat_history.created_at) AS last_message_at
      FROM chat_history
    `;

    const params = [];

    // فلترة حسب فترة زمنية (اختياري)
    if (days) {
      params.push(days);
     query += ` WHERE chat_history.created_at >= NOW() - INTERVAL '1 day' * $${params.length}`;
    }

    query += `
      GROUP BY chat_history.user_id
      ORDER BY total_messages DESC, last_message_at DESC
      LIMIT $${params.length + 1}
    `;

    params.push(limit);

    const result = await pool.query(query, params);

    return {
      ok: true,
      data: result.rows
    };

  } catch (error) {
    console.error("❌ Analytics Error (getTopUsers):", error.message);

    return {
      ok: false,
      error: error.message
    };
  }
};

/**
 * (اختياري مهم جداً) جلب نشاط المستخدمين بشكل أعمق
 */
const getUserActivityStats = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        user_id,
        COUNT(*) AS total_messages,
        COUNT(DISTINCT DATE(created_at)) AS active_days,
        MIN(created_at) AS first_seen,
        MAX(created_at) AS last_seen
      FROM chat_history
      GROUP BY user_id
      ORDER BY total_messages DESC
    `);

    return {
      ok: true,
      data: result.rows
    };

  } catch (error) {
    console.error("❌ Analytics Error (getUserActivityStats):", error.message);

    return {
      ok: false,
      error: error.message
    };
  }
};


/**
 * 📊 Total Messages + Users KPIs
 */
const getDashboardStats = async () => {
  try {
    const messagesQuery = await pool.query(`
      SELECT COUNT(*) AS total_messages FROM chat_history
    `);

    const usersQuery = await pool.query(`
      SELECT COUNT(DISTINCT user_id) AS total_users FROM chat_history
    `);

    const last7DaysQuery = await pool.query(`
      SELECT 
        DATE(created_at) AS date,
        COUNT(*) AS messages
      FROM chat_history
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    return {
      ok: true,
      data: {
        totalMessages: parseInt(messagesQuery.rows[0]?.total_messages || 0),
        totalUsers: parseInt(usersQuery.rows[0]?.total_users || 0),
        last7Days: last7DaysQuery.rows.map(r => ({
          date: r.date,
          messages: parseInt(r.messages)
        }))
      }
    };

  } catch (error) {
    return {
      ok: false,
      error: error.message
    };
  }
};

module.exports = { 
  getTopUsers,
  getUserActivityStats,
  getDashboardStats
};