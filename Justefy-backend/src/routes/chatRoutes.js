const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { handleChat } = require('../controllers/chatController');

const validateChatInput = [
  body('userId')
    .notEmpty()
    .withMessage('userId مطلوب')
    .trim(),
  body('message')
    .notEmpty()
    .withMessage('الرسالة لا يمكن أن تكون فارغة')
    .trim(), // 🚀 [تمت الإزالة]: أزلنا .escape() ليبقى النص العربي سليماً ومقروءاً للـ AI بنسبة 100%
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "Error",
        errors: errors.array().map(err => err.msg)
      });
    }
    next();
  }
];

router.post('/', validateChatInput, handleChat);

module.exports = router;