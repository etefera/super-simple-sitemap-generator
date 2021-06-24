/* eslint-disable no-console */
const program = require('commander');
const pkg = require('../package.json');
const fs = require("fs");

const Sitemapper = require("./models/Sitemapper");

/**
 * Command line tooling
 */
program
    .version(pkg.version)
    .name("sitemap")
    .usage('[options] <url>')
    .command('sitemap', 'Starts parsing the url.')
    .option('-w, --wait <miliseconds>', 'specify the time to wait before starting to parse the page (for CSR pages) (default 1500)', 1500)
    //.option('--no-deep <boolean>', 'blocks the iterators so only parses main urls, and not the ones found inside of them', false)
    .option('-l, --limit <number>', 'specify the limit of urls to parse', 99999)
    .option('-q, --query', 'include links with a query string', true);


program.on('--help', () => {
    console.log(`
  Example:
    sitemap --wait 2500 https://localhost:3000
`)
});

program.parse(process.argv);

async function run() {

    if (program.args.length < 1) {
        throw 'One parameter (url to parse) is required. For more info write sitemap --help.';
    }

    const mapper = new Sitemapper(program.wait, program.limit, program.query, ...program.args);
    await mapper.init();

    await Promise.all(mapper.baseUrls.map(async url => {
            try {
                console.log(`Parsing ${url}...`);
                await mapper.parse(url);
            } catch (error) {
                mapper.errors.push(`${url} could not be parsed!`)
            }
        })
    );

    if (mapper.errors.length) {
        console.error(mapper.errors.join('. '));
        process.exit(2);
    }

    // Parse all the urls that are found and valid in each page
    while (mapper.urls.length !== 0 && mapper.parsedUrls.length <= mapper.limit) {
        try {
            console.log(`Parsing ${mapper.urls[0]}...`);
            await mapper.parse(mapper.urls[0]);
        } catch (error) {
            mapper.errors.push(`${mapper.urls[0]} could not be parsed!`)
        }
    }

    if (mapper.errors.length) {
        console.error(mapper.errors.join('. '));
        process.exit(1);
    }

    try {
        mapper.generateXml();
        fs.writeFileSync("sitemap.xml", mapper.xml);
        console.log('Sitemap.xml generated successfully ✔');
    } catch (error) {
        mapper.errors.push(`There was an error generating the XML file!`);
        process.exit(2);
    }

    console.log('Process finished, check folder for sitemap.xml ❤!');
    process.exit(0);
}


run().catch(error => {
    setTimeout(() => {
        console.log(error)
    })
});
