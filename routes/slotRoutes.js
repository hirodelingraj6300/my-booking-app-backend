const express = require("express");
const { getSlots } = require("../controllers/slotController");
const router = express.Router();

// ✅ Only date required
router.get("/:date", getSlots);

module.exports = router;
