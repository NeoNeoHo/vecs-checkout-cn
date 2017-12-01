'use strict';
import _ from 'lodash';
import * as schedule from 'node-schedule';
import * as CTO from '../api/cto_shipment/cto_shipment.controller';

// ###################  中通快遞狀態更新系統 ######################
// ####
// ####
// ############################################################################################
var j = schedule.scheduleJob({hour: 10, minute: 1}, function(){
	console.log('開始更新中通快遞狀態');
	CTO.getOrderTrace().then((value) => {
		var now = new Date();
		console.log(now+ ':中通快遞狀態更新完畢');
	});
});
	console.log('開始更新中通快遞狀態');
	CTO.getOrderTrace().then((value) => {
		var now = new Date();
		console.log(now+ ':中通快遞狀態更新完畢');
	});