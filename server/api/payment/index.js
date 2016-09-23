'use strict';

var express = require('express');
var controller = require('./payment.controller');
var auth = require('../../auth/auth.service');
var cors = require('cors');
var router = express.Router();

var corsOptions = {
	origin: ['https://sslpayment.uwccb.com.tw/EPOSService/Payment/OrderInitial.aspx', /\.sslpayment\.uwccb\.com\.tw$/]
};

router.get('/cathay/rqXML/:order_id', auth.isAuthenticated(), controller.getCathayRqXML);
router.post('/cathay/callback/', cors(corsOptions), controller.getCathayCallback);
router.post('/cathay/success/redirect/', cors(corsOptions), controller.redirectSuccess);
router.post('/cathay/failure/redirect/', cors(corsOptions), controller.redirectFailure);
module.exports = router;
