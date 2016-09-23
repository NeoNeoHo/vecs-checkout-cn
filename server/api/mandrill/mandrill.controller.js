/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/customers              ->  index
 * POST    /api/customers              ->  create
 * GET     /api/customers/:id          ->  show
 * PUT     /api/customers/:id          ->  update
 * DELETE  /api/customers/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import db_config from '../../config/db_config.js';
import api_config from '../../config/api_config.js';
import q from 'q';
import moment from 'moment';
import mandrill from 'mandrill-api/mandrill';
var Order = require('../order/order.controller.js');
var mandrill_client = new mandrill.Mandrill(api_config.MANDRILL_KEY);

var mandrill_message_template = function(message_info, to_coll, merge_vars_coll, ga_campaign="md_order_success", tags=["default"]) {
	return {
		"from_email": message_info.from_email,
    	"from_name": message_info.from_name,
    	"subject": message_info.subject,
		"to": to_coll,
		"headers": {
			"Reply-To": "customer@vecsgardenia.com"
		},
		"important": false,
		"track_opens": null,
		"track_clicks": null,
		"auto_text": null,
		"auto_html": null,
		"inline_css": null,
		"url_strip_qs": null,
		"preserve_recipients": null,
		"view_content_link": null,
		"bcc_address": "benson@vecsgardenia.com",
		"tracking_domain": null,
		"signing_domain": null,
		"return_path_domain": null,
		"merge": true,
		"merge_language": "mailchimp",
		"global_merge_vars": [{
				"name": "merge1",
				"content": "merge1 content"
			}],
		"merge_vars": merge_vars_coll,
		"tags": tags,
		"google_analytics_domains": [
			"vecsgardenia.com"
		],
		"google_analytics_campaign": ga_campaign,
		"metadata": {
			"website": "www.vecsgardenia.com"
		}
	};
};

var sendErrorLog = function(order_id, error_log) {
	var defer = q.defer();
		var firstname = 'Benson';
		var email = 'benson@vecsgardenia.com';
		var template_name = api_config.mandrill_template.error_log;
		var template_content = [{
			"name": "example name",
			"content": "example content"
		}];
		var to_coll = [{
			"email": email,
			"name": firstname,
			"type": "to"
		}];
		var merge_vars_coll = [{
			"rcpt": email,
			"vars": [
				{
					"name": "order_id",
					"content": order_id
				},
				{
					"name": "error_log",
					"content": error_log
				}
			]
		}];
		var message_info = {
			from_name: "結帳系統",
			from_email: "benson@vecsgardenia.com",
			subject: "Error Log !!!"
		};
		var message = mandrill_message_template(message_info, to_coll, merge_vars_coll, "md_order_success", ['error_log']);
		var async = false;
		mandrill_client.messages.sendTemplate({"template_name": template_name, "template_content": template_content, "message": message, "async": async}, function(result) {
		    console.log(result);
		    defer.resolve(result);
		}, function(e) {
		    // Mandrill returns the error as an object with name and message keys
		    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
		    defer.reject(e);
		    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
		});
	return defer.promise;
};

var sendOrderSuccess = function(order_id) {
	var defer = q.defer();
	Order.lgetOrder(order_id).then(function(order_info) {
		if(_.size(order_info) == 0) defer.reject('invalid order_id while processing sendOrderSuccess');
		var firstname = order_info[0].firstname;
		var email = order_info[0].email;
		var template_name = api_config.mandrill_template.order_success;
		var template_content = [{
			"name": "example name",
			"content": "example content"
		}];
		var to_coll = [{
			"email": email,
			"name": firstname,
			"type": "to"
		}];
		var merge_vars_coll = [{
			"rcpt": email,
			"vars": [
				{
					"name": "order_id",
					"content": order_id
				}
			]
		}];
		var message_info = {
			from_name: "嘉丹妮爾的出貨小組",
			from_email: "customer@vecsgardenia.com",
			subject: "您的訂單已成功"
		};
		var message = mandrill_message_template(message_info, to_coll, merge_vars_coll, "md_order_success", ['order_success']);
		var async = false;
		mandrill_client.messages.sendTemplate({"template_name": template_name, "template_content": template_content, "message": message, "async": async}, function(result) {
		    console.log(result);
		    defer.resolve(result);
		}, function(e) {
		    // Mandrill returns the error as an object with name and message keys
		    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
		    defer.reject(e);
		    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
		});
	}, function(err) {
		console.log(err);
		defer.reject('invalid order_id while processing sendOrderSuccess');
	});
	return defer.promise;
};


var sendInviteMail = function(customer_name, invite_name, invite_email, rc_url) {
	var defer = q.defer();
	var template_name = api_config.mandrill_template.invite_friend;
	var template_content = [{
		"name": "example name",
		"content": "example content"
	}];
	var to_coll = [{
		"email": invite_email,
		"name": invite_name,
		"type": "to"
	}];
	var merge_vars_coll = [{
		"rcpt": invite_email,
		"vars": [
			{
				"name": "RC_URL",
				"content": rc_url+'&medium=mail'
			}
		]
	}];
	var message_info = {
		from_name: customer_name + " via 嘉丹妮爾",
		from_email: "customer@vecsgardenia.com",
		subject: "與好姐妹一起加入嘉丹妮爾"
	};
	var message = mandrill_message_template(message_info, to_coll, merge_vars_coll, "invite_friend", ['referral']);
	var async = false;
	mandrill_client.messages.sendTemplate({"template_name": template_name, "template_content": template_content, "message": message, "async": async}, function(result) {
	    console.log(result);
	    defer.resolve(result);
	}, function(e) {
	    // Mandrill returns the error as an object with name and message keys
	    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
	    defer.reject(e);
	    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
	});
	return defer.promise;
};

exports.sendOrderSuccess = sendOrderSuccess;

exports.sendOrderSuccessHttpPost = function(req, res){
	console.log('######## sendOrderSucessHttpPost');
	var order_id = req.body.order_id;
	if(!order_id) res.status(400).send('Error on sendOrderSuccess: no order_id');
	sendOrderSuccess(order_id).then(function(result) {
		res.status(200).json(result);
	}, function(err) {
		res.status(400).json(err);
	});
};

exports.sendErrorLogHttpPost = function(req, res){
	console.log('######## send Error Log Mail #######');
	var order_id = req.body.order_id;
	var error_log = req.body.error_log;
	if(!order_id) res.status(400).send('Error on sendOrderSuccess: no order_id');
	sendErrorLog(order_id, error_log).then(function(result) {
		res.status(200).json(result);
	}, function(err) {
		res.status(400).json(err);
	});
};

exports.sendInviteHttpPost = function(req, res) {
	console.log('@@@@@@@ Send Invite Friend Mail, From '+req.user.firstname+' to '+req.body.name+'/'+req.body.email+' @@@@@@@');
	var customer_name = req.user.firstname;
	var invite_name = req.body.name;
	var invite_email = req.body.email;
	var rc_url = req.body.rc_url;
	sendInviteMail(customer_name, invite_name, invite_email, rc_url).then(function(result) {
		res.status(200).json(result);
	}, function(err) {
		res.status(400).json(err);
	});
};
