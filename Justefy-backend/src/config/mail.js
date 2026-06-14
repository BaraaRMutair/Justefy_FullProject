const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  // ⚡ إزالة service: "gmail" وضبط الـ host يدوياً أفضل للتحكم بالبورتات
  host: "smtp.gmail.com",
  port: 465,         // المنفذ الآمن ضد الحظر
  secure: true,      // تفعيل التشفير الصارم والمباشر منذ البداية (SSL/TLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // تأكد أنه App Password من 16 حرفاً وليس كلمة مرور حسابك
  },
  tls: {
    // يحميك في بيئة الـ Localhost إذا كان هناك مشاكل في الشهادات المحلية
    rejectUnauthorized: false,
  },
  // ⚡ إضافة مؤقتات فحص صارمة لمنع السيرفر من التعليق للأبد في حال حدثت مشكلة شبكة
  connectionTimeout: 5000, // 5 ثوانٍ كحد أقصى للاتصال
  greetingTimeout: 5000,   // 5 ثوانٍ بانتظار ترحيب السيرفر
});

const sendEmail = async (to, subject, html) => {
  return transporter.sendMail({
    from: `"Justefy" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendEmail };