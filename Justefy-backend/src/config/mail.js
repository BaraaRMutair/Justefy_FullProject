const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,         // نعود لـ 587 لكن مع إجبار IPv4
  secure: false,     // false تعني استخدام STARTTLS وهو الأنسب للـ IPv4 محلياً
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
  family: 4,         // ⚡ إجبار صريح على استخدام IPv4 لمنع خطأ ENETUNREACH
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2"
  },
  connectionTimeout: 5000, 
  greetingTimeout: 5000,   
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