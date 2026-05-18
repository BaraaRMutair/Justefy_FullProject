const express = require("express");
const router = express.Router();

const { upsertLead } = require("../services/leadService");

router.post("/", async (req, res) => {
  try {
    const { name, email, phone, service, notes, source } = req.body;

    if (!phone && !email) {
      return res.status(400).json({
        ok: false,
        error: "Phone or email required",
      });
    }

    const result = await upsertLead({
      name,
      email,
      phone,
      service,
      notes,
      source: source || "website",
    });

    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

module.exports = router;