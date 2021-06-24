const puppeteer = require('puppeteer');
const timeout = require('../utils/timeout');
const UrlUtils = require('../utils/urls');
const builder = require('xmlbuilder');

class Sitemapper {

    /**
     * @param wait number
     * @param limit number
     * @param includeQueryString boolean
     * @param urls array
     */
    constructor(wait, limit, includeQueryString, ...urls) {
        /**
         * @type {*[]} of urls
         */
        this.baseUrls = [urls[0]];
        /**
         * Contains props with arrays of all urls found under that base url
         */
        this.urls = [urls[0]];
        /**
         * Runtime parsed urls
         */
        this.parsedUrls = [];
        /**
         * Milliseconds to wait on each parse for fetches and so to complete
         */
        this.wait = wait;
        /**
         * Milliseconds to wait on each parse for fetches and so to complete
         */
        this.limit = parseInt(limit);
        /**
         * Include URLs with a query string.
         */
        this.includeQueryString = includeQueryString;
        /**
         * puppeteer current open page
         * @type {null}
         */
        this.page = null;
        /**
         * puppeteer current open page
         * @type {null}
         */
        this.browser;
        /**
         * Current page being parsed
         * @type {null}
         */
        this.currentPage = null;
        /**
         * All errors found during parse
         * @type {*[]}
         */
        this.errors = [];
        /**
         * XML file generated from all the parsed urls
         * @type {string}
         */
        this.xml = '';
        /**
         * Current date as yyyy-mm-dd
         * @type {string}
         */
        this.currentDate = UrlUtils.getDate()
    }

    /**
     * Creates puppeteer "session"
     * @returns {Promise<void>}
     */
    async init() {
        this.browser = await puppeteer.launch();
    }

    /**
     * Parses all the urls
     * @returns {Promise<?Puppeteer.Response>}
     */
    async parse(url) {
        this.page = await this.browser.newPage();

        await this.page.goto(url);

        const begin = async () => {

            if (this.parsedUrls.includes(url)) {
                this.removeUrlFromUrls(url);
                return;
            }

            await timeout(this.wait);

            this.urls = [...await this.page.evaluate(() =>
                Array.from(document.querySelectorAll("a,link[rel='alternate']")).map(anchor => {
                    if (anchor.href.baseVal) {
                        const a = document.createElement("a");
                        a.href = anchor.href.baseVal;
                        return a.href;
                    }
                    return anchor.href;
                })
            ), ...this.urls];

            this.filterUrls();
            this.removeRepeatedUrls();
            this.removeUrlFromUrls(url);
            this.parsedUrls.push(url);
            this.removeParsedUrlsFromUrls();
        };

        return begin();
    }

    /**
     * Generates the content of the XML
     */
    generateXml() {

        const tempXml = builder.create('urlset').att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

        for (let url of this.parsedUrls) {
            tempXml.e('url')
                .e('loc', url).up()
                .e('lastmod', this.currentDate).up();
        }

        this.xml = tempXml.end({pretty: true});
    }

    /**
     * Remove an url from the url array
     * @param url
     */
    removeUrlFromUrls(url) {
        const index = this.urls.findIndex((element) => element === url);
        if (index !== -1) {
            this.urls.splice(index, 1);
        }
    }

    /**
     * Remove urls from urls array if they are already parsed
     * @param url
     */
    removeParsedUrlsFromUrls(url) {
        this.urls = this.urls.filter((url) => !this.parsedUrls.includes(url));
    }

    /**
     * Creates a new array without the repeated elements
     */
    removeRepeatedUrls() {
        this.urls = [...new Set(this.urls)]
    }

    /**
     * Filters the urls by different conditions
     */
    filterUrls() {
        this.urls = this.urls.filter((url) => UrlUtils.urlContainsPage(url, this.baseUrls[0]) && !UrlUtils.isUrlAnAnchor(url));
        if (!this.includeQueryString) {
            this.urls = this.urls.filter((url) => !UrlUtils.hasQueryString(url));
        }
    }
}

module.exports = Sitemapper;

