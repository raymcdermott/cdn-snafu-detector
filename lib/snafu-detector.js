var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var lazy = require('lazy.js');

function reportError(error, response) {
    if (error) {
        console.error('System Error: ' + error);
    } else {
        console.error("HTTP failure. Status code: " + response.statusCode + " URL: " + response.request.href);
    }
}

function parseHeaderData(response) {
    var headerData = {};

    headerData.statusCode = response.statusCode;
    headerData.request = response.request;

    if (response.headers)
        headerData.headers = response.headers;

    return headerData;
}

function getExternalHeaderData(urls, fn) {

    // Generate an array of functions to be called asynchronously
    var funcs = [];
    Lazy(urls).each(function (url) {
        var fn = function (callback) {
            request(url, function (error, response) {
                callback(null, parseHeaderData(response));
            });
        };

        funcs.push(fn);
    });

    async.parallel(funcs, function (err, results) {
        fn(results);
    });
}

function parseForInternalUrls(sourceUrl, response, pageBody, urls, siteUrl) {
    var urlData = {};

    urlData.sourceUrl = sourceUrl;
    urlData.responseCode = response.statusCode;
    urlData.headerData = parseHeaderData(response);

    if (response.statusCode === 200) {

        var parsedHtml = cheerio.load(pageBody, { normalizeWhitespace: true });

        var links = parsedHtml('a').map(function (i, el) {
            return parsedHtml(this).attr('href'); // find the links on the page
        }).toArray();

        links = lazy(links).filter(function (url) {
            return url && url.match(/^\//) && !(url.match(/^\/\//) || url.match(/^\/$/)); // find the internal links
        }).map(function (url) {
                return url.replace(/(.*)\?.*/, '$1'); // strip off any query parameters
            }).uniq().map(function (url) {
                return siteUrl + url // form the full http url
            }).without(urls).toArray();

        urlData.links = links;
    }

    // TODO: return urlData and fix up rest of the code to deal with newly enriched objects

    return links;
}

function followInternalUrls(siteUrl, urls, collectedData, callback) {

    if (!urls || urls.length === 0) {
        return callback(collectedData);
    }

    // Generate an array of functions to be called by async
    var funcs = [];
    lazy(urls).each(function (url) {
        if (url) {
            var fn = function (callback) {
                request(url, function (error, response, body) {
                    if (!error && response) {
                        callback(null, parseForInternalUrls(url, response, body, urls, siteUrl));
                    } else {
                        console.error('System Error: ' + error);
                        callback(null, []);
                    }
                });
            };

            funcs.push(fn);
        }
    });

    async.parallel(funcs, function (err, results) {
        var unvisitedUrls = lazy(results).flatten().uniq().toArray();

        // detect the URLs that we have not yet visited
        if (collectedData.length > 0)
            unvisitedUrls = lazy(unvisitedUrls).without(collectedData).toArray();

        var updatedCollectedData = collectedData.concat(unvisitedUrls);

        console.log('In total collected ' + updatedCollectedData.length + ' internal URLs so far. ' + unvisitedUrls.length + ' new');

        // TODO: Consider adding max-depth
        followInternalUrls(siteUrl, unvisitedUrls, updatedCollectedData, callback)
    });
}

function getSnafus(url, callback, snafuRegex) {

    request(url, function (error, response, body) {
        if (!error && response) {
            var pageBaseUrl = response.request.href.replace(/(http.*)\/.*/, '$1');

            followInternalUrls(pageBaseUrl, parseForInternalUrls(url, response, body, [], pageBaseUrl), [], callback);
        } else {
            console.error('System Error: ' + error);
        }
    });
}

module.exports = getSnafus;