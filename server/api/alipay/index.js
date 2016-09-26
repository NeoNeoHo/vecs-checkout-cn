'use strict';

var express = require('express');
var controller = require('./alipay.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

// router.get('/', controller.runTest);

router.get('/returnSync/', controller.create_direct_pay_by_user_return);
router.get('/wap/:order_id', auth.isAuthenticated(), controller.create_wap_direct_pay_by_user);
router.get('/:order_id', auth.isAuthenticated(), controller.create_direct_pay_by_user);
router.post('/notifyAsync/', controller.create_direct_pay_by_user_notify);

module.exports = router;
