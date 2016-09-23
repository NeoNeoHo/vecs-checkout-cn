'use strict';

var express = require('express');
var controller = require('./location.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/countries', controller.countries);
router.get('/cities/:country_id', controller.cities);
router.get('/districts/:city_id', controller.districts);
router.get('/customer',auth.isAuthenticated(), controller.getAddress);
router.put('/address', auth.isAuthenticated(), controller.updateAddress);


module.exports = router;
