const router = require("express").Router();

const {
  getDashboard,
  refreshDashboard,
} = require("../controllers/dashboardController");

router.get("/", getDashboard);

router.post("/refresh", refreshDashboard);

module.exports = router;