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
import url from 'url';

var ALIPAY_CONFIG = api_config.DEFAULT_ALIPAY_CONFIG;
var Order = require('../order/order.controller.js');
var Mail = require('../mandrill/mandrill.controller.js');
var AlipayNotify = require('./alipay_notify.class').AlipayNotify;    
var AlipaySubmit = require('./alipay_submit.class').AlipaySubmit;
var DOMParser = require('xmldom').DOMParser;


//支付宝即时到帐交易接口
/*data{
 out_trade_no:'' //商户订单号, 商户网站订单系统中唯一订单号，必填
 ,subject:'' //订单名称 必填
 ,total_fee:'' //付款金额,必填
 ,body:'' //订单描述
 ,show_url:'' //商品展示地址 需以http://开头的完整路径，例如：http://www.xxx.com/myorder.html
 }*/
exports.create_direct_pay_by_user = function(req, res) {
	var order_id = req.params.order_id;
	var customer_id = req.user._id;
	Order.lgetOrder(order_id).then(function(orders) {
		var order = orders[0] || orders;
		// order.total = 1;
		if(order.customer_id != customer_id) {
			res.status(400).send('Error: This order is not yours.');
		}
		var commercial_data = {
			out_trade_no: order_id,
			subject: 'order',
			total_fee: order.total,
			body:'',
			show_url:''
		};
		//建立请求
		var alipaySubmit = new AlipaySubmit(ALIPAY_CONFIG);
		var parameter = {
			service:'create_direct_pay_by_user',
			partner:ALIPAY_CONFIG.partner,
			payment_type:'1', //支付类型
			notify_url: url.resolve(ALIPAY_CONFIG.host, ALIPAY_CONFIG.create_direct_pay_by_user_notify_url), //服务器异步通知页面路径,必填，不能修改, 需http://格式的完整路径，不能加?id=123这类自定义参数
			return_url: url.resolve(ALIPAY_CONFIG.host , ALIPAY_CONFIG.create_direct_pay_by_user_return_url), //页面跳转同步通知页面路径 需http://格式的完整路径，不能加?id=123这类自定义参数，不能写成http://localhost/
			seller_email:ALIPAY_CONFIG.seller_email, //卖家支付宝帐户 必填		
			_input_charset:ALIPAY_CONFIG['input_charset'].toLowerCase().trim()
		};
		for(var key in commercial_data){
			parameter[key] = commercial_data[key];
		}
		var html_text = alipaySubmit.buildRequestForm(parameter,"get", "确认");
		res.send(html_text);
	}, function(err) {
		res.status(400).send('Error. Johny, fix it.');
	});
};

//支付宝手機網頁即时到帐交易接口
/*data{
 out_trade_no:'' //商户订单号, 商户网站订单系统中唯一订单号，必填
 ,subject:'' //订单名称 必填
 ,total_fee:'' //付款金额,必填
 ,body:'' //订单描述
 ,show_url:'' //商品展示地址 需以http://开头的完整路径，例如：http://www.xxx.com/myorder.html
 }*/
exports.create_wap_direct_pay_by_user = function(req, res) {
	var order_id = req.params.order_id;
	var customer_id = req.user._id;
	Order.lgetOrder(order_id).then(function(orders) {
		var order = orders[0] || orders;
		// order.total = 1;
		if(order.customer_id != customer_id) {
			res.status(400).send('Error: This order is not yours.');
		}
		var commercial_data = {
			out_trade_no: order_id,
			subject: 'order',
			total_fee: order.total,
			app_pay: 'Y',
			body:'',
			show_url:''
		};
		//建立请求
		var alipaySubmit = new AlipaySubmit(ALIPAY_CONFIG);
		var parameter = {
			service:'alipay.wap.create.direct.pay.by.user',
			partner:ALIPAY_CONFIG.partner,
			payment_type:'1', //支付类型
			notify_url: url.resolve(ALIPAY_CONFIG.host, ALIPAY_CONFIG.create_direct_pay_by_user_notify_url), //服务器异步通知页面路径,必填，不能修改, 需http://格式的完整路径，不能加?id=123这类自定义参数
			return_url: url.resolve(ALIPAY_CONFIG.host , ALIPAY_CONFIG.create_direct_pay_by_user_return_url), //页面跳转同步通知页面路径 需http://格式的完整路径，不能加?id=123这类自定义参数，不能写成http://localhost/
			seller_email:ALIPAY_CONFIG.seller_email, //卖家支付宝帐户 必填		
			_input_charset:ALIPAY_CONFIG['input_charset'].toLowerCase().trim()
		};
		for(var key in commercial_data){
			parameter[key] = commercial_data[key];
		}
		var html_text = alipaySubmit.buildRequestForm(parameter,"get", "确认");
		res.send(html_text);
	}, function(err) {
		res.status(400).send('Error. Johny, fix it.');
	});
};

//支付宝即时到帐交易接口，處理服务器异步通知
exports.create_direct_pay_by_user_notify = function(req, res){
	var _POST = req.body;
	//计算得出通知验证结果
	var alipayNotify = new AlipayNotify(ALIPAY_CONFIG);
	//验证消息是否是支付宝发出的合法消息
	alipayNotify.verifyNotify(_POST, function(verify_result){
		if(verify_result) {//验证成功
			//商户订单号
			var out_trade_no = _POST['out_trade_no'];
			//支付宝交易号
			var trade_no = _POST['trade_no'];
			//交易状态
			var trade_status = _POST['trade_status'];
			//交易金額
			var total_fee = _POST['total_fee'];
			//訂單更新訊息
			var update_msg = "交易付款时间:" + _POST['gmt_payment'] + ",买家支付宝账户号:" + _POST['buyer_id'] + ",交易状态:" + _POST['trade_status'] + ",支付宝交易号:" + _POST['trade_no'];
			
			Order.lgetOrder(out_trade_no).then(function(orders) {
				var order = orders[0] || orders;
				var order_status_id = order.order_status_id;
				var next_order_status_id = api_config.AlipayPaymentNextOrderStatusId(order_status_id);
				
				//回傳金額不正確，不予處理
				if(total_fee !== order.total) {
					console.log('order total_fee not equals to order total record');
					res.send('fail');
				} 
				//回傳內容正確，進行資料庫訂單更新
				else if(trade_status  == 'TRADE_FINISHED'){
					console.log(_POST);
					//请不要修改或删除
					res.send("success");
				}
				else if(trade_status == 'TRADE_SUCCESS'){
					updateOrderByAlipayResponse(order.order_id, update_msg, next_order_status_id).then(function(result) {
						Mail.sendOrderSuccess(order.order_id);
						//请不要修改或删除
						res.send("success");
					}, function(err) {
						console.log(err);
						res.send('fail');
					});
				}		
			}, function(err) {
				console.log(_POST + ' fails');
				res.send("fail");
			});
		}
		else {
			//验证失败
			console.log(_POST + ' fails');
			res.send("fail");
		}
	});
};


//支付宝即时到帐交易接口，處理页面跳转同步
exports.create_direct_pay_by_user_return = function(req, res){
	var _GET = req.query;
	//计算得出通知验证结果
	var alipayNotify = new AlipayNotify(ALIPAY_CONFIG);
	//验证消息是否是支付宝发出的合法消息
	alipayNotify.verifyReturn(_GET, function(verify_result){
		if(verify_result) {//验证成功
			//商户订单号
			var out_trade_no = _GET['out_trade_no'];
			//支付宝交易号
			var trade_no = _GET['trade_no'];
			//交易状态
			var trade_status = _GET['trade_status'];
			//交易金額
			var total_fee = _GET['total_fee'];
			res.redirect('/checkout/success?order_id='+out_trade_no);	
		}
		else {
			//验证失败
			console.log(_POST + ' fails');
			res.redirect('/checkout/failure?order_id='+order_id+'&msg=please_contact_us');
		}
	});
};


var updateOrderByAlipayResponse = function(order_id, update_msg, order_status_id) {
	var defer = q.defer();
	var order_update_dict = {
		payment_custom_field: update_msg, 
		order_status_id: order_status_id
	};
	var order_condition_dict = {
		order_id: order_id
	};

	var order_history_insert_dict = {
		order_id: order_id,
		order_status_id: order_status_id,
		notify: 0,
		comment:update_msg,
		date_added: new Date()
	};
	var sql = updateDictSql('oc_order', order_update_dict, order_condition_dict);
	sql += ';';
	sql += insertDictSql('oc_order_history', order_history_insert_dict);
	mysql_pool.getConnection(function(err, connection) {
		if(err) {
			console.log(err);
			defer.reject(err);
		} else {
			connection.query(sql, function(err, result) {
				if(err) {
					defer.reject(err);
				}
				defer.resolve(result)
			});								
		}
	});
	return defer.promise;
};