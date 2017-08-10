'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Chalk = require('chalk');

const Config = require('../../config');
const inert = require('inert');

module.exports = function(server, mongoose, logger) {

    //default error handler
    (function() {
        const Log = logger.bind(Chalk.magenta("Register"));

        server.register(inert, (err) => {
            if (err) {
                throw err;
            }
            server.route({
                method: 'GET',
                path: '/static/{param*}',
                config: {
                    handler: {
                        directory: {
                            path: './server/ui',
                            listing: true,
                            index: true
                        }
                    },
                    auth: null,
                    description: 'Default success handler!',
                    tags: ['api', 'default', 'success'],
                    validate: {},
                    pre: null
                },
            });
        });
    }());

};