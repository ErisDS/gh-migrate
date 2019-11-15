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
        const logUpdate = require('log-update');

        class CustomRenderer {
            constructor(tasks, options) {
                this._tasks = tasks;
                this._options = Object.assign({}, options);
            }

            static get nonTTY() {
                return true;
            }

            render() {
                this._tasks.forEach((task, index) => {
                    task.subscribe((event) => {
                        console.log('new event', event);
                        // if (event.type === 'STATE' && task.isPending()) {
                        //     logUpdate(`Executing task ${index + 1} of ${this._tasks.length}: ${task.title}`);
                        // }

                        // if (event.type === 'STATE' && task.hasFailed()) {
                        //     logUpdate(`Executing task ${index + 1} of ${this._tasks.length}: FAILED`);
                        //     logUpdate.done();
                        //     console.log(task);
                        // }
                    });
                });
                // for (const task of this._tasks) {
                //     task.subscribe((event) => {
                //         if (event.type === 'STATE' && task.isPending()) {
                //             console.log(task);
                //             //logUpdate()
                //         }
                //         // if (event.type === 'STATE' && task.isCompleted()) {
                //         //     console.log(`${task.title} [done]`);
                //         // }
                //     });
                // }
            }

            end(err) {
                logUpdate.done();
                // if (err) {
                //     console.log(err);
                // }
            }
        }

        const listrUpdateRenderer = require('listr-update-renderer');
        console.log(listrUpdateRenderer);

        class MyRenderer extends listrUpdateRenderer {

        }

        let tasks = [{
            title: 'Step 1: initialise',
            task: (ctx, task) => {
                // no op
            }
        },
        {
            title: 'Step 2: fucktonne of subtasks',
            task: (ctx, task) => {
                let numSubTasks = 20;
                let subtasks = [];
                for (let i = 0; i < numSubTasks; i++) {
                    subtasks.push({
                        title: `Task ${i + 1} of ${numSubTasks}`,
                        task: (ctx) => {
                            return new Promise((resolve, reject) => {
                                // no op
                                setTimeout(() => {
                                    if (i === 5) {
                                        return reject('a');
                                    }
                                    return resolve('z');
                                }, 500);
                            });
                        }
                    });
                }

                return new Listr(subtasks, {renderer: CustomRenderer, exitOnError: false});
            }
        }, {
            title: 'Step 3: finalise',
            task: (ctx) => {
                return Promise.resolve('lala');
            }
        }
        ];

        let numSubTasks = 10;
        let subtasks = [];
        for (let i = 0; i < numSubTasks; i++) {
            subtasks.push({
                title: `Tasky McTaskFace`,
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

        let runner = new Listr(subtasks, {renderer: CustomRenderer, exitOnError: false});
        // let runner = new Listr(tasks, {renderer: CustomRenderer, exitOnError: false});
        await runner.run(context);

        ui.log('finished');
        if (argv.verbose) {
            ui.log.info('Done', require('util').inspect(context.result.data, false, 2));
        }
    } catch (error) {
        ui.log.info('Done with errors', context.errors);
    }

    // Report success
    ui.log.ok(`Successfully written output to ${context.outputFile} in ${Date.now() - timer}ms.`);
};
