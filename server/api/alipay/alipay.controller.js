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
