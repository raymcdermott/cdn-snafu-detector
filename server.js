var getSnafus = require('./lib/snafu-detector');

var express = require('express');
var app = express();

function logErrors(err, req, res, next) {
    console.error(err.stack);
    next(err);
}

function clientErrorHandler(err, req, res, next) {
    if (req.xhr) {
        res.send(500, { error: 'Something blew up!' });
    } else {
        next(err);
    }
}

function errorHandler(err, req, res, next) {
    res.status(500);
    res.render('error', { error: err });
}

app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);

app.get('/', function(req, res){
    // eventually add a form for a URL that we will inspect for CDN SNAFUs

    var snafus = getSnafus('http://www.toyota-europe.com');

    console.log('snafus ' + snafus.firstUrl);

    res.send(snafus.firstUrl);

    // We will then generate a report on the SNAFUs
});

app.listen(3000);

// It should also be possible to run this via the CLI
