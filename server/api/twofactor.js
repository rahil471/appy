'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Chalk = require('chalk');

const Config = require('../../config');

const authStrategy = Config.get('/restHapiConfig/authStrategy');

module.exports = function(server, mongoose, logger) {

    // Access
    (function() {
        const Log = logger.bind(Chalk.magenta("Two-factor"));
        const Session = mongoose.model('session');

        const headersValidation = Joi.object({
            'authorization': Joi.string().required(),
            'scope': Joi.string().required()
        }).options({ allowUnknown: true });

        Log.note("Two factor");

        const twofactorsetupHandler = function(request, reply) {
            const credentials = request.auth.credentials;
            console.log(credentials);
            const strategy = request.params.strategy;
            switch(strategy){
                case 'sms':
                break;
                case 'email':
                break; 
                case 'google':
                break;
                default:
                
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
                pre: [{
                    assign: 'isAllowed',
                    method: function(request, reply){
                        const isAllowed = Config.get('/twoFA');
                        if(!isEnabled){
                            return reply(Boom.notFound('Not found'));
                        }
                        return reply(isAllowed);
                    }
                }],
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