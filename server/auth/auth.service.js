'use strict';

import passport from 'passport';
import config from '../config/environment';
import jwt from 'jsonwebtoken';
import expressJwt from 'express-jwt';
import compose from 'composable-middleware';
import User from '../api/user/user.model';
import db_config from '../config/db_config.js';
var mysql_pool = db_config.mysql_pool;

var validateJwt = expressJwt({
	secret: config.secrets.session
});

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
export function isAuthenticated() {
	return compose()
		// Validate jwt
		.use(function(req, res, next) {
			// allow access_token to be passed through query parameter as well
			if (req.query && req.query.hasOwnProperty('access_token')) {
				req.headers.authorization = 'Bearer ' + req.query.access_token;
			}
			// allow token to be pass through post body by ezship.com
			if (req.body && req.body.hasOwnProperty('webPara')) {
				req.headers.authorization = 'Bearer ' + req.body.webPara;
			}
			validateJwt(req, res, next);
		})
		// When Fail to validate JWT, res with status 401
		.use(function(err, req, res, next) {
			if (err.name === 'UnauthorizedError') {
				console.log('In authentication section 1');
				console.log(err);
				res.status(401).send(err);
			} else {
				next();
			}
		})
		// Attach user to request
		.use(function(req, res, next) {
			// console.log(req.user);
			mysql_pool.getConnection(function(err, connection){
				if(err) {
					console.log('In authentication section 2');
					console.log(err);
					connection.release();
					res.status(401).send(err);
				}
				var session_id = req.user.session_id || '';
				connection.query('select * from oc_customer where customer_id = ?',[req.user._id], function(err, rows) {
					connection.release();
					if(err) res.status(400).send(err);
					if(!rows[0]) {
						console.log('In authentication section 3');
						console.log(err);
						return res.status(401).end();
					}
					if(rows) {
						req.user = {
							role: 'user', 
							_id: rows[0].customer_id,
							customer_group_id: rows[0].customer_group_id,
							address_id: rows[0].address_id,
							email: rows[0].email,
							firstname: rows[0].firstname,
							address_id: rows[0].address_id,
							session_id: session_id,
							telephone: rows[0].telephone || 0
						};
						// console.log(req.user);
						next();
					}
				});
			});
		});
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
export function hasRole(roleRequired) {
	if (!roleRequired) {
		throw new Error('Required role needs to be set');
	}

	return compose()
		.use(isAuthenticated())
		.use(function meetsRequirements(req, res, next) {
			if (config.userRoles.indexOf(req.user.role) >=
					config.userRoles.indexOf(roleRequired)) {
				next();
			} else {
				res.status(403).send('Forbidden');
			}
		});
}

/**
 * Returns a jwt token signed by the app secret
 */
export function signToken(id, role) {
	return jwt.sign({ _id: id, role: role}, config.secrets.session, {
		expiresIn: 60 * 60 * 5
	});
}

/**
 * Set token cookie directly for oAuth strategies
 */
export function setTokenCookie(req, res) {
	if (!req.user) {
		return res.status(404).send('It looks like you aren\'t logged in, please try again.');
	}
	var token = signToken(req.user._id, req.user.role);
	res.cookie('token', token);
	res.redirect('/');
}
