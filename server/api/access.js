'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Chalk = require('chalk');

const Config = require('../../config');

const authStrategy = Config.get('/restHapiConfig/authStrategy');

module.exports = function (server, mongoose, logger) {

    // Access  Check
    (function () {
        const Log = logger.bind(Chalk.magenta("access"));
        const Session = mongoose.model('session');
        const User = mongoose.model('user');

        const checkAccessHeadersValidation = Joi.object({
            'authorization': Joi.string().required(),
            'scope': Joi.string().required()
        }).options({ allowUnknown: true });

        Log.note("Check Access");

        const checkAccessHandler = function (request, reply) {

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
                handler: checkAccessHandler,
                auth: authStrategy,
                description: 'Check Access.',
                tags: ['api', 'Access', 'checkaccess'],
                validate: {
                    headers: checkAccessHeadersValidation
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

        // Account Lock
        const accessLockHeadersValidation = Joi.object({
            'authorization': Joi.string().required()
        }).options({ allowUnknown: true });

        function lockUnlockUserAccess(lock, user, hours, datetime) {

            if (typeof user !== 'object') {
                let tmp = user;
                user = [];
                user.push(tmp)
            }
            let timeout;
            if (datetime) {
                timeout = datetime;
            } else {
                if (hours !== 0) {
                    timeout = new Date();
                    timeout.setUTCHours(timeout.getUTCHours() + hours);
                    timeout = timeout.toUTCString();
                } else {
                    timeout = 0;
                }
            }
            user = user.map(function (id) { return mongoose.Types.ObjectId(id) });
            let query = {
                "_id": {
                    $in: user
                }
            }
            let update = {
                $set: {
                    "access_lock_timeout": timeout
                }
            }
            let removeQuery = {
                "user": {
                    $in: user
                }
            }
            if (lock) {
                return User.update(query, update, { "multi": "true" })
                    .then(_ => Session.remove(removeQuery), { "multi": true })
                    .catch(error => {
                        Log.error(error);
                        return error;
                    });
            }
            return User.update(query, update, { "multi": "true" })
                .then(result => {
                    return null;
                })
                .catch(error => {
                    Log.error(error);
                    return error;
                });
        }

        const accessLockHandler = function (request, reply) {

            lockUnlockUserAccess(true, request.payload.userID, request.payload.locktimeout, request.payload.datetime)
                .then(result => {
                    return reply({
                        message: 'success',
                        error: 0
                    });
                })
                .catch(error => {
                    Log.error(error);
                    return reply(Boom.internal('Error while updating user access.'));
                });

        };

        server.route({
            method: 'post',
            path: '/access/lock',
            config: {
                handler: accessLockHandler,
                auth: authStrategy,
                description: 'Account Lock.',
                tags: ['api', 'Access', 'Account Lock'],
                validate: {
                    headers: accessLockHeadersValidation,
                    payload: {
                        'userID': Joi.array().items(Joi.string()).required(),
                        'locktimeout': Joi.number(),
                        'datetime': Joi.string()
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

        // Account Unlock

        const accessUnlockHeadersValidation = Joi.object({
            'authorization': Joi.string().required()
        }).options({ allowUnknown: true });

        Log.note("Account Unlock");

        const accessUnlockHandler = function (request, reply) {
            lockUnlockUserAccess(false, request.payload.userID, 0) //default IOS time(00-00-0000 00:00:00)
                .then(result => {
                    return reply({
                        message: 'success',
                        error: 0
                    });
                })
                .catch(error => {
                    Log.error(error);
                    return reply(Boom.internal('Error while updating user access.'));
                });
        };

        server.route({
            method: 'post',
            path: '/access/unlock',
            config: {
                handler: accessUnlockHandler,
                auth: authStrategy,
                description: 'Account Unlock.',
                tags: ['api', 'Access', 'Account Unlock'],
                validate: {
                    headers: accessUnlockHeadersValidation,
                    payload: {
                        userID: Joi.array().items(Joi.string()).required()
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