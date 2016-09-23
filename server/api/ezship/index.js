'use strict';

var express = require('express');
var controller = require('./ezship.controller');
var auth = require('../../auth/auth.service');
// var cors = require('cors');
var router = express.Router();
var corsOptions = {
	// origin: ['https://www.ezship.com.tw/emap/ezship_request_order_api.jsp', 'http://map.ezship.com.tw/ezship_map_web_2014.jsp', /\.ezship\.com\.tw$/]
};

router.get('/history/', auth.isAuthenticated(), controller.getHistory);
router.post('/history/', auth.isAuthenticated(), controller.upsertHistory);
router.post('/sendOrder/', auth.isAuthenticated(), controller.sendOrder);
router.get('/receiveOrder/', controller.receiveOrder);

module.exports = router;
