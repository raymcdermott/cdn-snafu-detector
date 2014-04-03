var request = require('request');
var cheerio = require('cheerio');
var async = require('async');


function parseHeaderData(error, response) {

}

function getExternalHeaderData(urls, fn) {

    // Generate an array of functions to be called asynchronously
    var funcs = [];
    urls.forEach(function (url) {
        var fn = function(callback) {
            request(url, function(error, response) {
                var returnData = {};

                if (!error && response.statusCode == 200) {
                    returnData.headers = response.headers;
                    returnData.statusCode = response.statusCode;
                    returnData.request = response.request;
                }
                else {
                    if (error) {
                        console.error('System Error: ' + error);
                        returnData.error = error;
                    }
                    else {
                        console.error("HTTP status code: " + response.statusCode + " URL: " + response.request.href);
                        returnData.statusCode = response.statusCode;
                        returnData.request = response.request;
                    }
                }
                callback(null, returnData);
            });
        };

        funcs.push(fn);
    });

    async.parallel(funcs, function (err, results) {
        fn(results);
    });
}

function getSnafus(url, callback, snafuRegex) {
    var hrefList = [];

    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var parsedHtml = cheerio.load(body, { normalizeWhitespace: true });

            hrefList = parsedHtml('a').map(function (i, el) {
                return parsedHtml(this).attr('href');
            }).toArray().sort().filter(function (element, index, array) {
                    return array.indexOf(element) === index;
                });

            var potentialExternalSnafus = hrefList.filter(function (url) {
                return url.match(snafuRegex);
            });

//            var internalURLs = hrefList.filter(function (url) {
//                return url && !(url.match(/^http.*/) || url.match(/^\/\//));
//            });

            getExternalHeaderData(potentialExternalSnafus, callback);

        } else {
            if (error)
                console.error(error);
            else
                console.error(response.statusCode);
        }
    });
}

module.exports = getSnafus;