'use strict';

var express = require('express');
var controller = require('./product.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/discount/:ids', auth.isAuthenticated(), controller.getDiscounts);
router.get('/price/:ids', auth.isAuthenticated(), controller.getPrices);
router.get('/:ids', auth.isAuthenticated(), controller.get);
router.post('/validate/', auth.isAuthenticated(), controller.validate);

module.exports = router;
