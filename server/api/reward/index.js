'use strict';

var express = require('express');
var controller = require('./reward.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.getCustomerReward);

module.exports = router;
