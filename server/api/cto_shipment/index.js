'use strict';

var express = require('express');
var controller = require('./cto_shipment.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/history/', auth.isAuthenticated(), controller.getHistory);
router.post('/history/', auth.isAuthenticated(), controller.upsertHistory);
router.post('/sendOrder/', auth.isAuthenticated(), controller.sendOrder);
router.get('/receiveOrder/', controller.receiveOrder);

module.exports = router;
