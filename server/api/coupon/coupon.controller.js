/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/coupons              ->  index
 * POST    /api/coupons              ->  create
 * GET     /api/coupons/:id          ->  show
 * PUT     /api/coupons/:id          ->  update
 * DELETE  /api/coupons/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import Coupon from './coupon.model';
import db_config from '../../config/db_config.js';
import moment from 'moment';
import q from 'q';
var mysql_pool = db_config.mysql_pool;
var mysql_config = db_config.mysql_config;

function respondWithResult(res, entity, statusCode) {
  statusCode = statusCode || 200;
  if (entity) {
    res.status(statusCode).json(entity);
  }
}

function handleEntityNotFound(res, entity) {
  if (!entity[0]) {
    res.status(404).end('ERROR 404');
  }
}

function handleError(res, err_msg, statusCode) {
  statusCode = statusCode || 500;
  res.status(statusCode).send(err_msg);
}



// Gets a single Coupon from the DB
export function show(req, res) {
	var promises = [];
  var coupon_code = req.params.id;
  var customer_id = req.user._id; 
  if(!coupon_code) handleError(res, 'You should keyin a coupon_code !!');
  promises.push(getCoupon(coupon_code, customer_id));
  promises.push(getCouponCategoryToProduct(coupon_code));
  promises.push(getCouponProduct(coupon_code));
  promises.push(getCouponHistory(coupon_code));

  q.all(promises).then(function(results) {
  	var coupon = results[0][0] || results[0], coupon_category = results[1], coupon_product = results[2], coupon_history = results[3];
  	var lresponse = {'status': true};
    if (coupon.length == 0) { lresponse.status = false}
    else {
      if (parseInt(coupon.uses_total) != 0) {lresponse.status = (parseInt(coupon.uses_total) > coupon_history.length) ? true : '此張優惠券已達可兌換次數';}
      if (parseInt(coupon.uses_customer) != 0) {lresponse.status = (parseInt(coupon.uses_customer) > _.filter(coupon_history, function(o) {return o.customer_id == customer_id}).length) ? true : '此張優惠券已達個人可兌換次數';}
    }
    lresponse['used_total'] = coupon_history.length;
    lresponse['setting'] = coupon;
    lresponse['products'] = coupon_product;
    lresponse['categories_to_products'] = coupon_category;
  	respondWithResult(res, lresponse);
    // respondWithResult(res, results);
  }, function(err) {
    console.log(err);
  	res.status(400).json(err);
  });
}

var getCoupon = function(code, customer_id) {
	var today = moment().format('YYYY-MM-DD');
	var defer = q.defer();
  mysql_pool.getConnection(function(err, connection){
    if(err) { 
    	connection.release();
    	defer.reject(err);
    }
    connection.query('select * from oc_coupon where code = ? and date_start <= ? and date_end >= ?;',[code, today, today] , function(err, rows) {
      connection.release();
      if(err) defer.reject(err);
      // if(_.size(rows) == 0) defer.reject({data: '沒有此一折扣碼，或此優惠碼已過期'});
      defer.resolve(rows);
    });
  });
  return defer.promise;
};

var getCouponCategoryToProduct = function(code) {
	var defer = q.defer();
  mysql_pool.getConnection(function(err, connection){
    if(err) { 
    	connection.release();
    	defer.reject(err);
    }
    connection.query('select c.product_id from oc_coupon_category a, oc_coupon b, oc_product_to_category c where a.coupon_id = b.coupon_id and b.code = ? and a.category_id = c.category_id;',[code] , function(err, rows) {
      connection.release();
      if(err) defer.reject(err);
      defer.resolve(rows);
    });
  });
  return defer.promise;
};

var getCouponProduct = function(code) {
	var defer = q.defer();
  mysql_pool.getConnection(function(err, connection){
    if(err) { 
    	connection.release();
    	defer.reject(err);
    }
    connection.query('select a.product_id from oc_coupon_product a, oc_coupon b where a.coupon_id = b.coupon_id and b.code = ?;',[code] , function(err, rows) {
      connection.release();
      if(err) defer.reject(err);
      defer.resolve(rows);
    });
  });
  return defer.promise;
};

var getCouponHistory = function(code) {
	var defer = q.defer();
  mysql_pool.getConnection(function(err, connection){
    if(err) { 
    	connection.release();
    	defer.reject(err);
    }
    connection.query('select a.* from oc_coupon_history a, oc_coupon b where a.coupon_id = b.coupon_id and b.code = ?;',[code] , function(err, rows) {
      connection.release();
      if(err) defer.reject(err);
      defer.resolve(rows);
    });
  });
  return defer.promise;
};

