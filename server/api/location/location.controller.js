/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/locations              ->  index
 * POST    /api/locations              ->  create
 * GET     /api/locations/:id          ->  show
 * PUT     /api/locations/:id          ->  update
 * DELETE  /api/locations/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import Location from './location.model';
import db_config from '../../config/db_config.js';
var mysql_pool = db_config.mysql_pool;
var mysql_config = db_config.mysql_config;	

function respondWithResult(res, entity, statusCode) {
  statusCode = statusCode || 200;
  if (entity || entity[0]) {
    res.status(statusCode).json(entity);
  }
}

function handleEntityNotFound(res, entity) {
  if (!entity[0]) {
    res.status(404).end();
  }
}

function handleError(res, err, statusCode) {
  statusCode = statusCode || 500;
  res.status(statusCode).send(err);
}



export function countries(req, res) {
	mysql_pool.getConnection(function(err, connection){
		if(err) handleError(res, err);
		var sql = 'select country_id, name from '+ mysql_config.db_prefix+'country where status = 1';
		connection.query(sql,[], function(err, rows) {
			connection.release();
			if(err) handleError(res, err);
			if(!(rows[0]||rows)) {
				res.status(404).end();
			} else {
				res.status(200).json(rows);
			}
		});
	});
}

export function cities(req, res) {
	var country_id = req.params.country_id;
	mysql_pool.getConnection(function(err, connection){
		if(err) handleError(res, err);
		var sql = 'select zone_id, name from '+ mysql_config.db_prefix+'zone where status = 1 and country_id = ' + country_id;
		connection.query(sql,[], function(err, rows) {
			connection.release();
			if(err) handleError(res, err);
			if(!(rows[0]||rows)) {
				res.status(404).end();
			} else {
				res.status(200).json(rows);
			}
		});
	});
}

export function districts(req, res) {
	var city_id = req.params.city_id;
	mysql_pool.getConnection(function(err, connection){
		if(err) handleError(res, err);
		var sql = 'select district_id, name, postcode from '+ mysql_config.db_prefix+'district where status = 1 and zone_id = ' + city_id;
		connection.query(sql,[], function(err, rows) {
			connection.release();
			if(err) handleError(res, err);
			if(!(rows[0]||rows)) {
				res.status(404).end();
			} else {
				res.status(200).json(rows);
			}
		});
	});
}

export function getAddress(req, res) {
	var customer_id = req.user._id;
	var address_id = req.user.address_id;
	mysql_pool.getConnection(function(err, connection){
		if(err) handleError(res, err);
		var sql = 'select a.*, b.name as city_name,  c.name as country_name, d.name as district_name, d.postcode as postcode from '+ mysql_config.db_prefix+'address a, ' + mysql_config.db_prefix + 'zone b, ' + mysql_config.db_prefix + 'country c, ' + mysql_config.db_prefix + 'district d where a.customer_id = ' + customer_id + ' and a.zone_id = b.zone_id and a.country_id = c.country_id and a.district_id = d.district_id order by a.address_id desc limit 1';
		if(address_id){
			sql = 'select a.*, b.name as city_name,  c.name as country_name, d.name as district_name, d.postcode as postcode from '+ mysql_config.db_prefix+'address a, ' + mysql_config.db_prefix + 'zone b, ' + mysql_config.db_prefix + 'country c, ' + mysql_config.db_prefix + 'district d where a.address_id = ' + address_id + ' and a.customer_id = ' + customer_id + ' and a.zone_id = b.zone_id and a.country_id = c.country_id and a.district_id = d.district_id';
		}
		connection.query(sql,[], function(err, rows) {
			connection.release();
			if(err) handleError(res, err);
			if(!(rows[0]||rows)) {
				res.status(404).end();
			} else {
				res.status(200).json(rows);
			}
		});
	});
}

export function updateAddress(req, res) {
	var customer_id = req.user._id;
	var address_id = req.user.address_id;
	var address = req.body.address;

	mysql_pool.getConnection(function(err, connection){
		if(err) handleError(res, err);
		connection.query('update '+ mysql_config.db_prefix + 'address set ? where customer_id = ? and address_id = ?',[address, customer_id, address_id] , function(err, result) {
			if(err) {
				console.log(err);
				connection.release();
				handleError(res, err);
			}
			else if(result.affectedRows == 0) {
				address.address_id = address_id;
				address.customer_id = customer_id;
				address.tax_id = 0;
				connection.query('insert into ' + mysql_config.db_prefix + 'address set ?;', address, function(err, result2) {
					connection.release();
					if(err) {
						console.log(err);
						res.status(400).json(err);
					}
					res.status(200).json(result2);
				});
			} 
			else {
				connection.release();
				res.status(200).json(result);
			}
		});

	});
}