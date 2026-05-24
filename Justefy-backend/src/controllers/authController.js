const authService = require('../services/authService');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await authService.register(name, email, password);

    res.json({
      status: "Success",
      user
    });

  } catch (err) {
    res.status(500).json({
      status: "Error",
      message: err.message
    });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    if (!result) {
      return res.status(401).json({ status: "Error", message: "بيانات الدخول غير صحيحة" });
    }

    // ✅ تحديث إعدادات الأمان لتتوافق مع نطاقات Vercel و Render السحابية
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: true,          // 🔒 إجبار التشفير دائماً لأن السحاب يفرض HTTPS
      sameSite: "none",      // 🌐 السماح بنقل الكوكي بين النطاقات المختلفة (Cross-Site)
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 أيام
    });

    res.json({
      status: "Success",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role 
      }
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
};

module.exports = { register, login };