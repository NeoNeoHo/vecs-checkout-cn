'use strict';

var express = require('express');
var controller = require('./cart.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/session/', auth.isAuthenticated(), controller.getSession);
router.put('/session/', auth.isAuthenticated(), controller.updateProducts);
router.delete('/session/', auth.isAuthenticated(), controller.deleteCart);

module.exports = router;
