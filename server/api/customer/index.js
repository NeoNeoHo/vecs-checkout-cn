'use strict';

var express = require('express');
var controller = require('./customer.controller');
var auth =  require('../../auth/auth.service');

var router = express.Router();

router.get('/:id', controller.get);
router.put('/updateCart/', auth.isAuthenticated(), controller.updateCart);
router.put('/', auth.isAuthenticated(), controller.update);
router.delete('/cart/', auth.isAuthenticated(), controller.clearCart);


module.exports = router;
