# A wrapper around `pg` for Express apps

Connects to a postgres database.  Provides a middleware to get a connection for each request and will automatically release that connection back to the pool on connection finish.  Provides an optional timeout for a request to release back to the pool in case of errors.

# Usage

```javascript
var db = require('pg-connect');

var app = require('express')();

// Setup middleware
app.use(db.middleware({
	releaseIn: 30 * 1000 // 30 seconds,
	// releaseOnClose: true // Will release on finish event by default
	// key: 'db' // The default key it adds to req
}));

app.get(function(req, res) {
	req.db.query('SELECT * from events;', function(err, resp) {
		res.status(200).json(resp);
	});
});
```
