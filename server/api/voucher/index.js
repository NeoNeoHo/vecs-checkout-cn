'use strict';

var express = require('express');
var controller = require('./voucher.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();


router.get('/:code', controller.show);


module.exports = router;
