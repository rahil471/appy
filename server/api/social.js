'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Chalk = require('chalk');

const Config = require('../../config');

const authStrategy = Config.get('/restHapiConfig/authStrategy');

module.exports = function(server, mongoose, logger) {

    // Google Login
    // (function() {
    //     const Log = logger.bind(Chalk.magenta("Login"));
    //     const AuthAttempt = mongoose.model('authAttempt');
    //     const Permission = mongoose.model('permission');
    //     const Session = mongoose.model('session');
    //     const User = mongoose.model('user');

    //     Log.note("Generating Login endpoint");

    //     const loginPre = [];

    //     const loginHandler = function(request, reply) {
    //         return reply(null);
    //     };

    //     server.route({
    //         method: 'GET',
    //         path: '/login/google',
    //         config: {
    //             handler: loginHandler,
    //             auth: null,
    //             description: 'Google login (hit the link from browser).',
    //             tags: ['api', 'Social', 'Google'],
    //             validate: {},
    //             pre: null,
    //             plugins: {
    //                 'hapi-swagger': {
    //                     responseMessages: [
    //                         { code: 200, message: 'Success' },
    //                         { code: 400, message: 'Bad Request' },
    //                         { code: 404, message: 'Not Found' },
    //                         { code: 500, message: 'Internal Server Error' }
    //                     ]
    //                 }
    //             }
    //         },
    //     });
    // }());

};