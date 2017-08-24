'use strict';

var express = require('express');
var controller = require('./mandrill.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

// router.get('/', controller.runTest);
router.post('/order/success/', auth.isAuthenticated(), controller.sendOrderSuccessHttpPost);
router.post('/order/errorLog/', auth.isAuthenticated(), controller.sendErrorLogHttpPost);
router.post('/sendNormal/', controller.sendNormalHttpPost);
module.exports = router;
