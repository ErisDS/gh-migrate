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
                if (task.subtasks.length > options.maxFullTasks) {
                    output = output.concat(renderFlatHelper(task.subtasks, options, level + 1));
                } else {
                    output = output.concat(renderFullHelper(task.subtasks, options, level + 1));
                }
            }
        }
    }

    return output.join('\n');
};

const renderFlatHelper = (tasks, options) => {
    let output = [];
    let states = {complete: [], failed: [], skipped: [], disabled: []};

    tasks.forEach((task, index) => {
        if (task.hasFailed()) {
            states.failed.push(task);
            output.push(`Executing task ${index + 1} of ${tasks.length}: FAILED - ${task.output}`);
        }
        if (task.isPending()) {
            output.push(`Executing task ${index + 1} of ${tasks.length}: ${task.title}`);
        }

        if (task.isCompleted()) {
            states.complete.push(task);
        }

        if (task.isSkipped()) {
            states.skipped.push(task);
        }

        if (!task.isEnabled()) {
            states.disabled.push(task);
        }
    });

    output.push(`Total: ${tasks.length}. Complete: ${states.complete.length}, Failed: ${states.failed.length}, Skipped: ${states.skipped.length}, Disabled: ${states.disabled.length}`);

    return output.join('\n');
};

const render = (mode, tasks, options) => {
    let renderHelper = mode === 'flat' ? renderFlatHelper : renderFullHelper;
    logUpdate(renderHelper(tasks, options));
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
        if (this._id) {
            // Do not render if we are already rendering
            return;
        }

        this._mode = this._tasks.length > this._options.maxFullTasks ? 'flat' : 'full';

            this._id = setInterval(() => {
            render(this._mode, this._tasks, this._options);
            }, 100);
        }

    end(err) {
        if (this._id) {
            clearInterval(this._id);
            this._id = undefined;
        }

        render(this._mode, this._tasks, this._options);

        if (this._options.clearOutput && err === undefined) {
            logUpdate.clear();
        } else {
            logUpdate.done();
        }
    }
}

module.exports = SmartRenderer;
