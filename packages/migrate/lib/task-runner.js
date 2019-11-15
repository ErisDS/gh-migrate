const Listr = require('listr');

module.exports = (tasks, options) => {
    let nonVerboseRenderer = options.renderer || 'default';
    return new Listr(tasks, {
        renderer: options.verbose ? 'verbose' : nonVerboseRenderer,
        exitOnError: options.exitOnError || false
    });
};
