'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Chalk = require('chalk');

const Config = require('../../config');

module.exports = function(server, mongoose, logger) {

    // import user
    (function() {
        const Log = logger.bind(Chalk.magenta("Login"));
        const AuthAttempt = mongoose.model('authAttempt');
        const Permission = mongoose.model('permission');
        const Session = mongoose.model('session');
        const User = mongoose.model('user');

        Log.note("Generating Login endpoint");

        const headersValidation = Joi.object({
            'authorization': Joi.string().required()
        }).options({ allowUnknown: true });

        const importUserHandler = function(request, reply) {
            return reply(null);
        };

        const userSchema = {
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            email: Joi.string().email().required(),
            role: Joi.array().items(Joi.string()).required(),
            password: Joi.string().required()
        };

        server.route({
            method: 'post',
            path: '/user/import',
            config: {
                handler: importUserHandler,
                auth: null,
                description: 'Import Users',
                tags: ['api', 'user import'],
                validate: {
                    headers: headersValidation,
                    query: {
                        users: Joi.array().min(1).items(Joi.object(userSchema)).required()
                    }
                },
                pre: null,
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

    // preferences
    (function() {
        const Log = logger.bind(Chalk.magenta("Login"));
        const AuthAttempt = mongoose.model('authAttempt');
        const Permission = mongoose.model('permission');
        const Session = mongoose.model('session');
        const User = mongoose.model('user');

        // Log.note("Generating Login endpoint");

        const headersValidation = Joi.object({
            'authorization': Joi.string().required()
        }).options({ allowUnknown: true });

        const preferenceHandler = function(request, reply) {
            return reply(null);
        };

        const userSchema = {
            tow_factor: Joi.boolean().required()
        };

        server.route({
            method: 'post',
            path: '/user/{_userid}/preference',
            config: {
                handler: preferenceHandler,
                auth: null,
                description: 'preferences',
                tags: ['api', 'Preference'],
                validate: {
                    headers: headersValidation,
                    query: {
                        tow_factor: Joi.boolean().required()
                    }
                },
                pre: null,
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

    // preferences
    (function() {
        const Log = logger.bind(Chalk.magenta("Login"));
        const AuthAttempt = mongoose.model('authAttempt');
        const Permission = mongoose.model('permission');
        const Session = mongoose.model('session');
        const User = mongoose.model('user');

        // Log.note("Generating Login endpoint");

        const headersValidation = Joi.object({
            'authorization': Joi.string().required()
        }).options({ allowUnknown: true });

        const preferenceHandler = function(request, reply) {
            return reply(null);
        };

        const userSchema = {
            tow_factor: Joi.boolean().required()
        };

        server.route({
            method: 'get',
            path: '/user/{_userid}/preferences',
            config: {
                handler: preferenceHandler,
                auth: null,
                description: 'Get Preferences by user_id',
                tags: ['api', 'Preferences'],
                validate: {
                    headers: headersValidation,
                    query: {
                        tow_factor: Joi.boolean().required()
                    }
                },
                pre: null,
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

        server.route({
            method: 'put',
            path: '/user/{_userid}/preferences',
            config: {
                handler: preferenceHandler,
                auth: null,
                description: 'Update user Preferences by user_id',
                tags: ['api', 'Preferences'],
                validate: {
                    headers: headersValidation,
                    query: {
                        tow_factor: Joi.boolean().required()
                    }
                },
                pre: null,
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