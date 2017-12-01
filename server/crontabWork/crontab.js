'use strict';
import _ from 'lodash';
import * as schedule from 'node-schedule';
import * as CTO from '../api/cto_shipments/cto_shipments.controller';

// ###################  中通快遞狀態更新系統 ######################
// ####
// ####
// ############################################################################################
var j = schedule.scheduleJob({hour: 15, minute: 59}, function(){
	console.log('開始更新中通快遞狀態');
	CTO.getOrderTrace().then((value) => {
		var now = new Date();
		console.log(now+ ':中通快遞狀態更新完畢');
	});
});
