'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Chalk = require('chalk');

const Config = require('../../config');

const authStrategy = Config.get('/restHapiConfig/authStrategy');

module.exports = function(server, mongoose, logger) {

    // Access
    (function() {
        const Log = logger.bind(Chalk.magenta("Logout"));
        const Session = mongoose.model('session');

        const headersValidation = Joi.object({
            'authorization': Joi.string().required(),
            'scope': Joi.string().required()
        }).options({ allowUnknown: true });

        Log.note("Check Access");

        const accessHandler = function(request, reply) {
            console.log(request.auth.credentials.scope);
            console.log(request.headers.scope);
            const credentials = request.auth.credentials || { session: null };
            // const session = credentials.session;
            request.auth.credentials.scope = request.auth.credentials.scope || [];
            if (request.auth.credentials.scope.indexOf(request.headers.scope) >= 0) {
                return reply({ message: 'Success.' });
            } else {
                return reply(Boom.notFound('scope not found.'));
            }
        };

        server.route({
            method: 'get',
            path: '/access/check',
            config: {
                handler: accessHandler,
                auth: authStrategy,
                description: 'Check Access.',
                tags: ['api', 'Access', 'checkaccess'],
                validate: {
                    headers: headersValidation
                },
                plugins: {
                    'hapi-swagger': {
                        responseMessages: [
                            { code: 200, message: 'Success' },
                            { code: 400, message: 'Bad Request' },
                            { code: 404, message: 'Not Found' },
                            { code: 500, message: 'Internal Server Error' }
                        ]
                    }
                }
            }
        });
    }());

    // Account Lock
    (function() {
        const Log = logger.bind(Chalk.magenta("Logout"));
        const Session = mongoose.model('session');

        const headersValidation = Joi.object({
            'authorization': Joi.string().required()
        }).options({ allowUnknown: true });

        Log.note("Account Lock");

        const accessHandler = function(request, reply) {
            return reply({ message: 'Success.' });
        };

        server.route({
            method: 'post',
            path: '/access/lock',
            config: {
                handler: accessHandler,
                auth: authStrategy,
                description: 'Account Lock.',
                tags: ['api', 'Access', 'Account Lock'],
                validate: {
                    headers: headersValidation,
                    query: {
                        userid: Joi.string().required(),
                        locktimeout: Joi.string().required()
                    }
                },
                plugins: {
                    'hapi-swagger': {
                        responseMessages: [
                            { code: 200, message: 'Success' },
                            { code: 400, message: 'Bad Request' },
                            { code: 404, message: 'Not Found' },
                            { code: 500, message: 'Internal Server Error' }
                        ]
                    }
                }
            }
        });
    }());

    // Account Unlock
    (function() {
        const Log = logger.bind(Chalk.magenta("Logout"));
        const Session = mongoose.model('session');

        const headersValidation = Joi.object({
            'authorization': Joi.string().required()
        }).options({ allowUnknown: true });

        Log.note("Account Unlock");

        const accessHandler = function(request, reply) {
            return reply({ message: 'Success.' });
        };

        server.route({
            method: 'post',
            path: '/access/unlock',
            config: {
                handler: accessHandler,
                auth: authStrategy,
                description: 'Account Unlock.',
                tags: ['api', 'Access', 'Account Unlock'],
                validate: {
                    headers: headersValidation,
                    query: {
                        userid: Joi.string().required()
                    }
                },
                plugins: {
                    'hapi-swagger': {
                        responseMessages: [
                            { code: 200, message: 'Success' },
                            { code: 400, message: 'Bad Request' },
                            { code: 404, message: 'Not Found' },
                            { code: 500, message: 'Internal Server Error' }
                        ]
                    }
                }
            }
        });
    }());
};