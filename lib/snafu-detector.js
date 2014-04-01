var request = require('request');
var cheerio = require('cheerio');

var output = {};

function getSnafus(url) {
    output.src = url;

    return request(url, function (err, resp, body) {
        if (!err && resp.statusCode == 200) {
            var parsedHtml = cheerio.load(body, { normalizeWhitespace: true });
            output.firstUrl = parsedHtml('a').attr('href'); //.first();
        }
        return output;
    });
}

module.exports = getSnafus;