/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/ezships              ->  index
 * POST    /api/ezships              ->  create
 * GET     /api/ezships/:id          ->  show
 * PUT     /api/ezships/:id          ->  update
 * DELETE  /api/ezships/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import db_config from '../../config/db_config.js';
import api_config from '../../config/api_config.js';
import q from 'q';

const mysql_pool = db_config.mysql_pool;
const mysql_config = db_config.mysql_config;  

export function getBuyXGetY(req, res) {
	var is_started = false;
	if (is_started) {
		var content = {
			category_ids: [146],
			product_ids: 'all', 
			X: 3,
			Y: 1,
			description: '買三送一'
		};
		if (content.category_ids !== 'all' && content.product_ids === 'all') {
			mysql_pool.getConnection(function(err, connection) {
				if(err) {
					connection.release();
					return res.status(200).json({status: true, content: content});
				}
				var sql = 'select product_id from oc_product_to_category where category_id in (?);';
				connection.query(sql, content.category_ids, function(err, rows) {
					connection.release();
					if(err) {
						return res.status(200).json({status: true, content: content});
					}
					content.product_ids = _.map(rows, 'product_id');
					return res.status(200).json({status: true, content: content});
				});
			});
		} else {
			return res.status(200).json({status: true, content: content});
		}
	} else {
		return res.status(200).json({status: false});
	}
};
export function getBuySameCategory_X_BundlePrice_P(req, res) {
	var is_started = true;  // true: campaign is running; false: campaign paused
	if (is_started) {
		var content_coll = [
			{
				category_ids: [190], // [156]
				product_ids: 'all', //'all' or [153], 
				X: 2,    // 任選四件
				Y: 220, // 1200元
				description: '面膜專區任選四件320元'
			}
			//,{
			// 	category_ids: [184],
			// 	product_ids: 'all',
			// 	X: 3,
			// 	Y: 390,
			// 	description: '凍膜泥膜專區任選三件390元'
			// },{
			// 	category_ids: [181],
			// 	product_ids: 'all',
			// 	X: 3,
			// 	Y: 420,
			// 	description: '防曬底妝專區任選三件420元'
			// }
		];

		var category_ids = [];
		_.forEach(content_coll, (content) => {
			if (content.category_ids !== 'all' && content.product_ids === 'all'){
				category_ids = _.union(category_ids, content.category_ids);
			}
		});
		if(category_ids.length) {
			mysql_pool.getConnection(function(err, connection) {
				if(err) {
					console.log(err);
					connection.release();
					return res.status(200).json({status: true, content_coll: content_coll});
				}
				var sql = 'select product_id, category_id from oc_product_to_category where category_id in (?);';
				connection.query(sql, [category_ids], function(err, rows) {
					connection.release();
					if(err) {
						console.log(err);
						return res.status(200).json({status: true, content_coll: content_coll});
					}
					content_coll = _.map(content_coll, (content) => {
						if(content.category_ids !== 'all' && content.product_ids === 'all'){
							var new_product_ids = [];
							_.forEach(rows, (row) => {
								if(content.category_ids.includes(row.category_id)){
									new_product_ids.push(row.product_id);
								}
							});
							content.product_ids = new_product_ids;
							return content;
						} else {
							return content;
						}
					});
					return res.status(200).json({status: true, content_coll: content_coll});
				});
			});			
		} else {
			return res.status(200).json({status: true, content_coll: content_coll});
		}
	} else {
		return res.status(200).json({status: false});
	}
};
