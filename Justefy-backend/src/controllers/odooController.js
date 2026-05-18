const odooService = require('../services/odooService');
const { sendEmail } = require('../config/mail');

// 1. جلب العملاء
const fetchCustomers = async (req, res) => {
    const result = await odooService.getCustomers();
    if (!result.ok) return res.status(500).json({ status: "Error", message: result.error });
    res.json({ status: "Success", data: result.data });
};

// 2. معالجة الـ Leads 
const submitLead = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      service,
      message,
    } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        status: "Error",
        message: "Email or phone required"
      });
    }

    // =========================
    // 1. Check existing lead
    // =========================
    const existing = await odooService.findLeadByPhoneOrEmail({
      phone,
      email,
    });

    // =========================
    // 2. If exists → verify it's still in Odoo
    // =========================
    if (existing?.ok && existing?.data?.id) {

      const check = await odooService.getLeadById(existing.data.id);

      // Lead not found anymore → create new
      if (!check?.ok || !check?.data) {

        const created = await odooService.createLead({
          name,
          email,
          phone,
          service,
          notes: message,
        });

        return res.json({
          status: "Success",
          mode: "created_fallback",
          leadId: created.data,
        });
      }

      // =========================
      // 3. Update existing lead safely
      // =========================
      await odooService.updateLead(existing.data.id, {
        name: `${name} - ${service}`,
        contact_name: name,
        email_from: email,
        phone,
        description: `
Service: ${service}

Message:
${message}
        `,
      });

      return res.json({
        status: "Success",
        mode: "updated",
        leadId: existing.data.id,
      });
    }

    // =========================
    // 4. Create new lead (no existing)
    // =========================
    const created = await odooService.createLead({
      name,
      email,
      phone,
      service,
      notes: message,
    });

    return res.json({
      status: "Success",
      mode: "created",
      leadId: created.data,
    });

  } catch (error) {
    console.error("❌ submitLead error:", error);

    return res.status(500).json({
      status: "Error",
      message: "Lead submit failed"
    });
  }
};

// 3. وظيفة فحص الاشتراكات 
const checkSubscriptions = async (req, res) => {
    try {
       
        const result = await odooService.execute(
            'res.partner',
            'search_read',
            [[['x_x_subscription_end_date', '!=', false]]],
            { fields: ['name', 'email', 'x_x_subscription_end_date'] }
        );

        const today = new Date();
        const results = result.map(partner => {
            const expiryDate = new Date(partner.x_x_subscription_end_date);
            const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            const needsWarning = diffDays <= 7 && diffDays >= 0;

            if (needsWarning && partner.email) {
                const htmlContent = `
                    <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif; padding: 20px; border: 1px solid #f97316; border-radius: 15px;">
                        <h2 style="color: #f97316;">تنبيه من Justefy Agency</h2>
                        <p>مرحباً <b>${partner.name}</b>،</p>
                        <p>اشتراكك في خدمة AdGenius ينتهي خلال <b>${diffDays}</b> أيام.</p>
                        <a href="https://justefy.com" style="background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 10px;">جدد الآن</a>
                    </div>
                `;
                sendEmail(partner.email, 'تنبيه انتهاء الاشتراك - Justefy', htmlContent).catch(console.error);
            }

            return {
                name: partner.name,
                daysLeft: diffDays,
                status: needsWarning ? 'EXPIRING_SOON' : 'ACTIVE'
            };
        });

        res.json({ status: "Success", data: results });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};
const fetchProducts = async (req, res) => {
    const result = await odooService.getProducts();
    if (!result.ok) return res.status(500).json({ status: "Error", message: "فشل في جلب المنتجات" });
    res.json({ status: "Success", data: result.data });
};
module.exports = { 
    fetchCustomers, 
    fetchProducts, 
    submitLead, 
    checkSubscriptions 
};