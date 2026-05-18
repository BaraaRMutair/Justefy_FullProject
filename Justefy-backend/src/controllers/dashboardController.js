// 1. استيراد الدوال من الـ Service (هون الأسماء محجوزة)
const {
  getDashboardCached,
  refreshDashboardCache,
} = require("../services/dashboardCacheService");


const getDashboard = async (req, res) => {
  try {
    // هان بننادي الدالة اللي استوردناها من الـ Service
    const data = await getDashboardCached();
    return res.json(data);
  } catch (err) {
    console.error("Dashboard Error:", err);
    return res.status(500).json({
      success: false,
      message: "خطأ في جلب بيانات الداشبورد"
    });
  }
};

// 3. دالة التحديث
const refreshDashboard = async (req, res) => {
  try {
    const data = await refreshDashboardCache();
    return res.json(data);
  } catch (err) {
    console.error("Refresh Error:", err);
    return res.status(500).json({
      success: false,
    });
  }
};

// 4. التصديرس
module.exports = {
  getDashboard,
  refreshDashboard,
};