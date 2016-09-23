'use strict';

var express = require('express');
var controller = require('./megamenu.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', controller.getTree);

module.exports = router;
