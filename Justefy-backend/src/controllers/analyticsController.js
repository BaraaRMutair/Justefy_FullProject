const analyticsService = require('../services/analyticsService');


const topUsers = async (req, res) => {
  try {
   
    const limit = parseInt(req.query.limit) || 5;
    const days = req.query.days ? parseInt(req.query.days) : null;

    const result = await analyticsService.getTopUsers(limit, days);

    if (!result.ok) {
      return res.status(500).json({
        status: "Error",
        message: "فشل في جلب بيانات التحليلات",
        error: result.error
      });
    }

    return res.json({
      status: "Success",
      meta: {
        limit,
        days: days || "ALL_TIME"
      },
      data: result.data
    });

  } catch (error) {
    console.error("❌ Analytics Controller Error:", error.message);

    return res.status(500).json({
      status: "Error",
      message: "Unexpected server error",
      error: error.message
    });
  }
};


const userActivityStats = async (req, res) => {
  try {
    const result = await analyticsService.getUserActivityStats();

    if (!result.ok) {
      return res.status(500).json({
        status: "Error",
        message: "فشل في جلب إحصائيات المستخدمين",
        error: result.error
      });
    }

    return res.json({
      status: "Success",
      data: result.data
    });

  } catch (error) {
    return res.status(500).json({
      status: "Error",
      message: "Unexpected server error",
      error: error.message
    });
  }
};



const dashboard = async (req, res) => {
  try {
    const stats = await analyticsService.getDashboardStats();

    if (!stats.ok) {
      return res.status(500).json({
        status: "Error",
        message: "فشل في جلب بيانات الداشبورد",
        error: stats.error
      });
    }

    return res.json({
      status: "Success",
      data: {
        kpis: {
          totalMessages: stats.data.totalMessages,
          totalUsers: stats.data.totalUsers
        },
        charts: {
          last7DaysMessages: stats.data.last7Days
        }
      }
    });

  } catch (error) {
    console.error("❌ Dashboard Controller Error:", error.message);

    return res.status(500).json({
      status: "Error",
      message: "Server error",
      error: error.message
    });
  }
};






module.exports = {
  topUsers,
  userActivityStats,
  dashboard
};