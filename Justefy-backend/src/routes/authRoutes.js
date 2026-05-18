const router = require('express').Router();
const { register, login } = require('../controllers/authController');
const rateLimit = require("express-rate-limit");

router.post('/register', register);
router.post('/login', login);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: "Too many login attempts, try again later"
});

router.post('/login', authLimiter, login);
router.post('/register', register);
module.exports = router;