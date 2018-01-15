'use strict';

var express = require('express');
var controller = require('./promotion.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();


router.get('/buyXGetY', auth.isAuthenticated(), controller.getBuyXGetY);


module.exports = router;
