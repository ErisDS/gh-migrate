const ui = require('@tryghost/pretty-cli').ui;

// Internal ID in case we need one.
exports.id = 'test';

// The command to run and any params
exports.flags = 'test';

// Description for the top level command
exports.desc = 'Test the migrate CLI UI';

// Configure all the options
exports.setup = (sywac) => {
    sywac.boolean('-V --verbose', {
        defaultValue: false,
        desc: 'Show verbose output'
    });
};

// What to do when this command is executed
exports.run = async (argv) => {
    let timer = Date.now();
    let context = {errors: []};

    if (argv.verbose) {
        ui.log.info(`Running a test`);
    }

    try {
        // Fetch the tasks, configured correctly according to the options passed in
        // let migrate = medium.getTaskRunner(argv.pathToZip, argv);

        // Run the migration
        // await migrate.run(context);
        // const makeTaskRunner = require('../lib/task-runner');

        const Listr = require('listr');
        const myRenderer = require('@tryghost/listr-smart-renderer');
        const options = {renderer: myRenderer, exitOnError: false, maxFullTasks: 10, concurrent: 2};

        const getSubTasks = (numSubTasks = 5) => {
            let subtasks = [];
            for (let i = 0; i < numSubTasks; i++) {
                subtasks.push({
                    title: `Tasky McTaskFace ${i}`,
                    enabled: ctx => i !== 3,
                    skip: ctx => i === 1,
                    task: (ctx) => {
                        return new Promise((resolve, reject) => {
                            // no op
                            setTimeout(() => {
                                if (i === 5) {
                                    return reject(new Error('blah blah'));
                                }
                                return resolve('z');
                            }, 500);
                        });
                    }
                });
            }

            return subtasks;
        };

        let tasks = [{
            title: 'Step 1: initialise',
            task: (ctx, task) => {
                // no op
            }
        },
        {
            title: 'Step 2: fucktonne of subtasks',
            task: (ctx, task) => {
                return new Listr(getSubTasks(15), options);
            }
        }, {
            title: 'Step 3: skipped',
            skip: ctx => true,
            task: (ctx) => {
                return Promise.resolve('lala');
            }
        },
        {
            title: 'Step 4: finalise',
            task: (ctx) => {
                return Promise.resolve('lala');
            }
        },
        {
            title: 'Step 5: disabled',
            enabled: ctx => false,
            task: (ctx) => {
                return Promise.resolve('lala');
            }
        }
        ];

        let runner;

        // Nested Runner
        if (argv.nested) {
            runner = new Listr(tasks, options);
        } else {
            // Simple Runner
            let t = getSubTasks(15);
            t.push({
                title: 'last thing',
                task: () => {
                    return new Listr(getSubTasks(20), options);
                }
            });
            runner = new Listr(t, options);
        }

        await runner.run(context);

        ui.log('finished');
        if (argv.verbose) {
            ui.log.info('Done', require('util').inspect(context.result.data, false, 2));
        }
    } catch (error) {
        ui.log.info('Done with errors');
        if (context.errors.length > 0) {
            ui.log.error(context.errors);
        } else {
            ui.log.error(error);
        }
    }

    // Report success
    ui.log.ok(`Successfully written output to ${context.outputFile} in ${Date.now() - timer}ms.`);
};
