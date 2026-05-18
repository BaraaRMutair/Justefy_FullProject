const router = require('express').Router();

const { dashboard, topUsers } = require('../controllers/analyticsController');


const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');


router.get(
  '/dashboard',
  protect,
  authorizeRoles('admin'),
  dashboard
);


router.get(
  '/top-users',
  protect,
  authorizeRoles('admin'),
  topUsers
);

module.exports = router;