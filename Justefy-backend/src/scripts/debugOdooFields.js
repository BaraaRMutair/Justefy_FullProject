const odooService = require("../services/odooService");

const testFields = async () => {
  try {
    const fields = await odooService.execute(
      "sale.order",
      "fields_get",
      []
    );

    console.log("📦 Odoo Fields:");
    console.log(Object.keys(fields));

  } catch (err) {
    console.error("❌ Error fetching fields:", err);
  }
};

testFields();