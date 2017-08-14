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
        const Session = mongoose.model('session');
        const User = mongoose.model('user');

        const headersValidation = Joi.object({
            'authorization': Joi.string().required()
        }).options({ allowUnknown: true });

        Log.note("Two factor");

        const twofactorsetupHandler = function(request, reply) {
            const credentials = request.auth.credentials;
            let user = request.pre.user;
            const strategy = request.params.strategy;
            switch(strategy){
                case 'sms':
                    if(!user.phone_number){
                        return reply(Boom.notAcceptable("SMS strategy requires user to setup his Phone number"));
                    }
                    user.twofactor.strategy = strategy;
                    user.twofactor.enabled = true;
                    user.twofactor.sms = {
                        otp: "",
                        validtill: ""
                    };
                break;
                case 'email':
                    user.twofactor.strategy = strategy;
                    user.twofactor.enabled = true;
                    user.twofactor.email = {
                        otp: "",
                        validtill: ""
                    };
                break;
                case 'google':
                    Log.note('Entering google startegy');
                    var secret = speakeasy.generateSecret();
                    user.twofactor.strategy = strategy;
                    user.twofactor.enabled = false;
                    user.twofactor.google = {
                        secret: "",
                        tempSecret: secret.base32,
                        otpauthUrl: secret.otpauth_url
                    }
                break;
                default:
                break;
            }

            QRCode.toDataURL(secret.otpauth_url, (err, data_url)=>{
                console.log(data_url);
                user.twofactor.dataUrl = data_url;
                user.save().then((result) => {
                    return reply({
                        message: 'success',
                        error: 0,
                        setup: user.twofactor
                    });
                })
                .catch(err => {
                    return reply(Boom.internal('Error setting up Two-factor.'));
                })
            });
        };
        server.route({
            method: 'post',
            path: '/twofactor/setup/{strategy}',
            config: {
                handler: twofactorsetupHandler,
                auth: authStrategy,
                description: 'Setup two factor authentication',
                tags: ['api', 'twofactor'],
                pre: [{
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
                }],
                validate: {
                    headers: headersValidation,
                    params: {
                        strategy: Joi.string().required().valid('sms', 'email', 'google')
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
};