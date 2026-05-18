const express = require('express');
const router = express.Router();
const odooController = require('../controllers/odooController');

router.get('/customers', odooController.fetchCustomers);
router.get('/products', odooController.fetchProducts);
router.get('/check-subscriptions', odooController.checkSubscriptions);
router.post('/leads', odooController.submitLead);




module.exports = router;
