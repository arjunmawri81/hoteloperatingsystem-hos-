const express = require("express");
const router = express.Router();
const {
  getAllInvoices,
  createInvoice,
  markPaid,
} = require("../controllers/invoices.controller");

router.get("/", getAllInvoices);
router.post("/", createInvoice);
router.patch("/:id/pay", markPaid);

module.exports = router;
