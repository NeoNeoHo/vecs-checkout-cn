'use strict';

var express = require('express');
var controller = require('./alipay.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

// router.get('/', controller.runTest);
router.get('/:order_id', auth.isAuthenticated(), controller.create_direct_pay_by_user);
// router.post('/order/success/', auth.isAuthenticated(), controller.sendOrderSuccessHttpPost);
// router.post('/order/errorLog/', auth.isAuthenticated(), controller.sendErrorLogHttpPost);

module.exports = router;
