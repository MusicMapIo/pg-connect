var pg = require('pg'),
	util = require('util'),
	once = require('once'),
	apiErrors = require('api-errors'),
	logger = require('logtastic');

var pgc = module.exports = function(options) {
	options = options || {};
	pgc.user = options.user || process.env.POSTGRES_USER;
	pgc.password = options.password || process.env.POSTGRES_PASSWORD;
	pgc.host = options.host || process.env.POSTGRES_HOST;
	pgc.db = options.db || process.env.POSTGRES_DB;
	pgc.connectionString = util.format('postgres://%s:%s@%s/%s', pgc.user, pgc.password, pgc.host, pgc.db);
	return pgc;
};

// Get a connection, log err on failure
pgc.connect = function(done) {
	pg.connect(pgc.connectionString, function(err, client, release) {
		if (err) {
			logger.error(err, {
				connString: pgc.connectionString
			});
			return done(err);
		}
		done(null, client, release);
	});
};

// A middleware generator with options
pgc.middleware = function(options) {
	options = options || {};

	return function(req, res, next) {
		pgc.connect(function(err, conn, release) {
			if (err) {
				// The error is logged inside db
				return apiErrors.e500(res, {
					message: 'Error connecting to database',
					code: 'db-conn-error',
				});
			}

			// Only call release once
			release = once(release);

			// Start timeout if one was set
			var _to;
			if (options.releaseIn) {
				_to = setTimeout(function() {
					logger.warning('DB connection released after timeout');
					req.db = null;
					release();
				}, options.releaseIn);
			}

			// Release on close
			if (options.releaseOnClose !== false) {
				res.on('finish', function() {
					logger.debug('Releasing db connection on finish');
					clearTimeout(_to);
					req.db = null;
					release();
				});
			}

			// Add connection to request object
			req[options.key || 'db'] = conn;
			next();
		});
	};
};
