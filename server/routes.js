/**
 * Main application routes
 */

'use strict';

import errors from './components/errors';
import path from 'path';

export default function(app) {
	// Insert routes below
	app.use('/api/customers', require('./api/customer'));
	app.use('/api/rewards', require('./api/reward'));
	app.use('/api/coupons', require('./api/coupon'));
	app.use('/api/carts', require('./api/cart'));
	app.use('/api/ezships', require('./api/ezship'));
	app.use('/api/locations', require('./api/location'));
	app.use('/api/mandrills', require('./api/mandrill'));
	app.use('/api/megamenus', require('./api/megamenu'));
	app.use('/api/orders', require('./api/order'));
	app.use('/api/products', require('./api/product'));
	app.use('/api/payment', require('./api/payment'));
	app.use('/api/things', require('./api/thing'));
	app.use('/api/vouchers', require('./api/voucher'));
	app.use('/api/users', require('./api/user'));

	app.use('/auth', require('./auth'));

	// All undefined asset or api routes should return a 404
	app.route('/:url(api|auth|components|app|bower_components|assets)/*')
	 .get(errors[404]);

	// All other routes should redirect to the index.html
	app.route('/*')
		.get((req, res) => {
			res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
		});
}
