/**
 * Checks if url contains the base page, we don't want external urls
 * @param url
 * @param page
 * @returns {boolean}
 */
function urlContainsPage(url, page) {
    return url.substr(0, 25).includes(page);
}

/**
 * Checks for anchors
 * @param url
 * @returns {boolean}
 */
function isUrlAnAnchor(url) {
    return url.includes('#');
}

/**
 * Checks if url has a query string
 * @param url
 * @returns {boolean}
 */
function hasQueryString(url) {
    return url.includes('?');
}

/**
 * Generates current date (as today) with yyy-mm-dd format
 * @returns {string}
 */
function getDate() {
    let d = new Date(),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}

/**
 * Object
 */
module.exports = UrlUtils = {
    urlContainsPage,
    isUrlAnAnchor,
    getDate,
};
