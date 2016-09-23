'use strict';

import _ from 'lodash';
import db_config from '../../config/db_config.js';
import api_config from '../../config/api_config.js';
import q from 'q';
import request from 'request';

var mysql_pool = db_config.mysql_pool;
var mysql_config = db_config.mysql_config;	


var getTree = function() {
	var defer = q.defer();
	request.get('https://vecsgardenia.com/index.php?route=api/megamenu/getTree', function(err, Response, body) {
		console.log(body);
		// console.log(Response);
		var content = JSON.parse(body);
		var treemenu = content.treemenu;
		// console.log(treemenu);
		// var treemenu = '<div></div>';
		defer.resolve(treemenu);
	});
	return defer.promise;
};

exports.getTree = function(req, res) {
	getTree().then(function(data) {
		res.status(200).json(data);
	}, function(err) {
		res.status(400).json(data);
	});
};
