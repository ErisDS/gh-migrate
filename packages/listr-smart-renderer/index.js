'use strict';
const logUpdate = require('log-update');
const chalk = require('chalk');
const figures = require('figures');
const indentString = require('indent-string');
const cliTruncate = require('cli-truncate');
const stripAnsi = require('strip-ansi');
const utils = require('./lib/utils');

const renderFullHelper = (tasks, options, level) => {
    level = level || 0;

    let output = [];

    for (const task of tasks) {
        if (task.isEnabled()) {
            const skipped = task.isSkipped() ? ` ${chalk.dim('[skipped]')}` : '';

            output.push(indentString(` ${utils.getSymbol(task, options)} ${task.title}${skipped}`, level, '  '));

            if ((task.isPending() || task.isSkipped() || task.hasFailed()) && utils.isDefined(task.output)) {
                let data = task.output;

                if (typeof data === 'string') {
                    data = stripAnsi(data.trim().split('\n').filter(Boolean).pop());

                    if (data === '') {
                        data = undefined;
                    }
                }

                if (utils.isDefined(data)) {
                    const out = indentString(`${figures.arrowRight} ${data}`, level, '  ');
                    output.push(`   ${chalk.gray(cliTruncate(out, process.stdout.columns - 3))}`);
                }
            }

            if ((task.isPending() || task.hasFailed() || options.collapse === false) && (task.hasFailed() || options.showSubtasks !== false) && task.subtasks.length > 0) {
                output = output.concat(renderFullHelper(task.subtasks, options, level + 1));
            }
        }
    }

    return output.join('\n');
};

const renderFull = (tasks, options) => {
    logUpdate(renderFullHelper(tasks, options));
};

const renderFlatSummary = (tasks) => {
    logUpdate(`Finished executing ${tasks.length} tasks`);
};

const renderFlat = (tasks, options) => {
    tasks.forEach((task, index) => {
        task.subscribe((event) => {
            // console.log('new event', event);
            if (event.type === 'STATE' && task.isPending()) {
                logUpdate(`Executing task ${index + 1} of ${tasks.length}: ${task.title}`);
            }

            if (event.type === 'STATE' && task.hasFailed()) {
                logUpdate(`Executing task ${index + 1} of ${tasks.length}: FAILED`);
                logUpdate.done();
                // console.log(task);
            }
        });
    });
};

class SmartRenderer {
    constructor(tasks, options) {
        this._tasks = tasks;
        this._mode = 'full';
        this._options = Object.assign({
            maxFullTasks: 50,
            showSubtasks: true,
            collapse: true,
            clearOutput: false
        }, options);
    }

    render() {
        if (this._tasks.length > this._options.maxFullTasks) {
            this._mode = 'flat';
            renderFlat(this._tasks, this._options);
        } else {
            this._mode = 'full';
            if (this._id) {
                // Do not render if we are already rendering
                return;
            }

            this._id = setInterval(() => {
                renderFull(this._tasks, this._options);
            }, 100);
        }
    }

    end(err) {
        if (this._mode === 'full') {
            if (this._id) {
                clearInterval(this._id);
                this._id = undefined;
            }

            renderFull(this._tasks, this._options);

            if (this._options.clearOutput && err === undefined) {
                logUpdate.clear();
            } else {
                logUpdate.done();
            }
        } else if (this._mode === 'flat') {
            renderFlatSummary(this._tasks);
        }
    }
}

module.exports = SmartRenderer;
