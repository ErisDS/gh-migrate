const ui = require('@tryghost/pretty-cli').ui;
const json = require('../../lib/utilties/json');

exports.id = 'json-image';

exports.flags = 'image <pathToJSON>';

// Configure all the options
exports.setup = (sywac) => {
    sywac.boolean('-V --verbose', {
        defaultValue: false,
        desc: 'Show verbose output'
    });
    sywac.string('-d --domain', {
        defaultValue: false,
        desc: 'Provide a root domain'
    });
};

exports.desc = 'Run the image scraper';

exports.paramsDesc = ['Path to a Ghost JSON file to convert'];

// What to do when this command is executed
exports.run = async (argv) => {
    let timer = Date.now();
    let context = {errors: []};

    if (argv.verbose) {
        ui.log.info(`Running image scraping on ${argv.pathToJSON}`);
    }

    try {
        // Fetch the tasks, configured correctly according to the options passed in
        let utility = json.getTaskRunner('image', argv.pathToJSON, argv);

        // Run the migration
        await utility.run(context);

        if (argv.verbose) {
            ui.log.info('Done', require('util').inspect(context.result, false, 3));
        }
    } catch (error) {
        ui.log.info('Done with errors', context.errors);
    }

    if (argv.verbose) {
        ui.log.info(`Cached files can be found at ${context.fileCache.cacheDir}`);
    }

    // Report success
    ui.log.ok(`Successfully written output to ${context.outputFile} in ${Date.now() - timer}ms.`);
};
