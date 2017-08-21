'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Chalk = require('chalk');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const Config = require('../../config');

const authStrategy = Config.get('/restHapiConfig/authStrategy');

module.exports = function(server, mongoose, logger) {

    // Access
    (function() {
        const Log = logger.bind(Chalk.magenta("Two-factor"));
        const User = mongoose.model('user');

        //prerequisite for API
        const pre = [{
            assign: 'isAllowed',
            method: function(request, reply){
                Log.note('isAllowed');
                const isAllowed = Config.get('/twoFA');
                if(!isAllowed){
                    return reply(Boom.notFound('Not found'));
                }
                return reply(isAllowed);
            }
        },{
            assign: 'user',
            method: function(request, reply){
                Log.note('user');
                const condition = {
                    email: request.auth.credentials.user.email
                };
                User.findOne(condition).then((user)=>{
                    if(!user){
                        return reply(Boom.notFound("User Does not exist."));
                    }
                    return reply(user);
                }).catch((err)=>{
                    return reply(Boom.badImplementation());
                });
            }
        }, {
            assign: 'oldstrategy',
            method: function(request, reply){
                Log.note('oldstrategy');
                return reply(request.pre.user.twofactor);
            }
        },{
            assign: 'configure',
            method: function(request, reply){
                Log.note('configure');
                if(request.payload.overwrite){
                    request.pre.user.twofactor = {};
                    return reply(true);
                }                        
                if(request.pre.oldstrategy && request.pre.oldstrategy.strategy && request.pre.oldstrategy.enabled === true){
                    return reply(Boom.conflict(`Two factor authentication is already configured as ${request.pre.oldstrategy.strategy}, use overwrite=true, to force.`));
                }
                request.pre.user.twofactor = {};
                return reply(true);
            }
        }];

        const headersValidation = Joi.object({
            'authorization': Joi.string().required()
        }).options({ allowUnknown: true });

        Log.note("Two factor");

        const twofactorsetupHandler = function(request, reply) {
            const credentials = request.auth.credentials;
            let user = request.pre.user;
            const strategy = request.params.strategy;
            switch(strategy){
                case 'standard':
                    user.twofactor.strategy = strategy;
                    user.twofactor.enabled = true;
                    user.twofactor.standard = {
                        otp: "",
                        validtill: ""
                    };
                    user.save().then((result) => {
                        return reply({
                            message: 'success',
                            error: 0,
                            setup: user.twofactor
                        });
                    })
                    .catch(err => {
                        return reply(Boom.internal('Error setting up Two-factor.'));
                    });
                break;
                case 'totp':
                    Log.note('Entering totp startegy');
                    var secret = speakeasy.generateSecret({length:10});
                    user.twofactor.strategy = strategy;
                    user.twofactor.enabled = false;
                    user.twofactor.totp = {
                        secret: "",
                        tempSecret: secret.base32,
                        otpauthUrl: secret.otpauth_url,
                        dataUrl: ""
                    }
                    QRCode.toDataURL(secret.otpauth_url, (err, data_url)=>{
                        user.twofactor.totp.dataUrl = data_url;
                        user.save().then((result) => {
                            return reply({
                                message: 'Two-factor setup initiated, please confirm with validation.',
                                error: 0,
                                setup: user.twofactor
                            });
                        })
                        .catch(err => {
                            return reply(Boom.internal('Error setting up Two-factor.'));
                        });
                    });
                break;
                default:
                break;
            }
        };
        server.route({
            method: 'post',
            path: '/twofactor/setup/{strategy}',
            config: {
                handler: twofactorsetupHandler,
                auth: authStrategy,
                description: 'Setup two factor authentication',
                tags: ['api', 'twofactor'],
                pre: pre,
                validate: {
                    headers: headersValidation,
                    params: {
                        strategy: Joi.string().required().valid('standard', 'totp')
                    },
                    payload: {
                        overwrite: Joi.boolean()
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


    // Confirm totp two-factor
    (function() {
        const Log = logger.bind(Chalk.magenta("Two-factor"));
        const User = mongoose.model('user');

        //prerequisite for API
        const pre = [
            {
                assign: 'isAllowed',
                method: function(request, reply){
                    const isAllowed = Config.get('/twoFA');
                    if(!isAllowed){
                        return reply(Boom.notFound('Not found'));
                    }
                    return reply(isAllowed);
                }
            },
            {
                assign: 'user',
                method: function(request, reply){
                    Log.note('user');
                    const condition = {
                        email: request.auth.credentials.user.email
                    };
                    User.findOne(condition).then((user)=>{
                        if(!user){
                            return reply(Boom.notFound("User Does not exist."));
                        }
                        return reply(user);
                    }).catch((err)=>{
                        return reply(Boom.badImplementation());
                    });
                }
            },
            {
                assign: 'isInitiated',
                method: function(request, reply){
                    const user = request.pre.user;
                    if(user.twofactor && user.twofactor.strategy === 'totp'){
                        return reply(true);
                    } else {
                        return reply(Boom.notAcceptable('Two-factor setup is not initiated for this user.'));
                    }
                }
            },
            {
                assign: 'verify',
                method: function(request, reply){
                    const user = request.pre.user;
                    const secret = user.twofactor.totp.tempSecret;
                    const otp = request.payload.otp;
                    const verified = speakeasy.totp.verify({ secret: secret,
                                                             encoding: 'base32',
                                                             token: otp });
                    
                    return reply(verified);
                }
            }
        ];

        const headersValidation = Joi.object({
            'authorization': Joi.string().required()
        }).options({ allowUnknown: true });

        Log.note("Two factor");

        const handler = function(request, reply) {
            const isVerified = request.pre.verify;
            let user = request.pre.user;
            if(!isVerified){
                return reply(Boom.notAcceptable('Invalid OTP, verification failed.'));
            }
            user.twofactor.totp.secret = user.twofactor.totp.tempSecret;
            user.twofactor.enabled = true;
            user.markModified('twofactor');
            user.save().then((result) => {
                return reply('success');
            })
            .catch(err => {
                return reply(Boom.internal('Error enabling Two-factor Authentication.'));
            });
        };
        server.route({
            method: 'post',
            path: '/twofactor/setup/totp/confirm',
            config: {
                handler: handler,
                auth: authStrategy,
                description: 'Confirm and enable Two-factor authentication using totp authenticator',
                tags: ['api', 'twofactor'],
                pre: pre,
                validate: {
                    headers: headersValidation,
                    payload: {
                        otp: Joi.number().required()
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


    // Disable two-factor for user
    (function() {
        const Log = logger.bind(Chalk.magenta("Two-factor"));
        const User = mongoose.model('user');

        //prerequisite for API
        const pre = [
            {
                assign: 'isAllowed',
                method: function(request, reply){
                    Log.note('isAllowed');
                    const isAllowed = Config.get('/twoFA');
                    if(!isAllowed){
                        return reply(Boom.notFound('Not found'));
                    }
                    return reply(isAllowed);
                }
            },
            {
                assign: 'user',
                method: function(request, reply){
                    Log.note('user');
                    const condition = {
                        email: request.auth.credentials.user.email
                    };
                    User.findOne(condition).then((user)=>{
                        if(!user){
                            return reply(Boom.notFound("User Does not exist."));
                        }
                        return reply(user);
                    }).catch((err)=>{
                        return reply(Boom.badImplementation());
                    });
                }
            }
        ];

        const headersValidation = Joi.object({
            'authorization': Joi.string().required()
        }).options({ allowUnknown: true });

        Log.note("Two factor disable");

        const handler = function(request, reply) {
            let user = request.pre.user;
            user.twofactor = {};
            user.save().then((result) => {
                return reply('success');
            })
            .catch(err => {
                Log.error(err);
                return reply(Boom.internal('Error disabling Two-factor Authentication.'));
            });
        };
        server.route({
            method: 'delete',
            path: '/twofactor/setup',
            config: {
                handler: handler,
                auth: authStrategy,
                description: 'Turn-off two factor authentication',
                tags: ['api', 'twofactor'],
                pre: pre,
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

    // Get two-factor setup details
    (function() {
        const Log = logger.bind(Chalk.magenta("Two-factor"));
        const User = mongoose.model('user');

        //prerequisite for API
        const pre = [
            {
                assign: 'isAllowed',
                method: function(request, reply){
                    Log.note('isAllowed');
                    const isAllowed = Config.get('/twoFA');
                    if(!isAllowed){
                        return reply(Boom.notFound('Not found'));
                    }
                    return reply(isAllowed);
                }
            },
            {
                assign: 'user',
                method: function(request, reply){
                    Log.note('user');
                    const condition = {
                        email: request.auth.credentials.user.email
                    };
                    User.findOne(condition).then((user)=>{
                        if(!user){
                            return reply(Boom.notFound("User Does not exist."));
                        }
                        return reply(user);
                    }).catch((err)=>{
                        return reply(Boom.badImplementation());
                    });
                }
            }
        ];

        const headersValidation = Joi.object({
            'authorization': Joi.string().required()
        }).options({ allowUnknown: true });

        Log.note("Two factor disable");

        const handler = function(request, reply) {
            const user = request.pre.user;
            const twofactor = request.pre.user.twofactor || {};
            reply(twofactor);
        };
        server.route({
            method: 'get',
            path: '/twofactor/setup',
            config: {
                handler: handler,
                auth: authStrategy,
                description: 'Get two factor setup details',
                tags: ['api', 'twofactor'],
                pre: pre,
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
};