const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // 📂 استدعاء اتصال الداتابيز لجلب البيانات الحية

const protect = async (req, res, next) => {
  let token;

  // From header
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // From cookie
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 🔍 جلب بيانات المستخدم كاملة من الداتابيز السحابية لضمان قراءة الـ role الحالي
    const userQuery = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
    
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // تخرين بيانات المستخدم كاملة وبشكل صحيح داخل الـ req
    req.user = userQuery.rows[0]; 
    
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { protect };