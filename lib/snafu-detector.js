var request = require('request');
var cheerio = require('cheerio');
var Q = require('q');

// Ideally do these requests in parallel
function getHeaderData(urls) {

    // Use q to do the business


}

function getSnafus(url, callback) {
    var hrefList = [];

    request(url, function (err, resp, body) {
        if (!err && resp.statusCode == 200) {
            var parsedHtml = cheerio.load(body, { normalizeWhitespace: true });

            hrefList = parsedHtml('a').map(function (i, el) {
                return parsedHtml(this).attr('href');
            }).toArray().sort().filter(function (element, index, array) {
                    return array.indexOf(element) === index;
                });

            var externalURLs = hrefList.filter(function (url) {
                return url && url.match(/^http/);
            });

            var headerData = getHeaderData(externalURLs);

            callback(headerData);

        } else {
            console.error(err);
        }
    });
}

module.exports = getSnafus;