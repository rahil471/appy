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


    (function() {
        const passport = require('hapi-passport');
        var BearerStrategy = require('passport-azure-ad').BearerStrategy;

        let config = {};

        // const creds = {
        //     // Requried
        //     identityMetadata: 'https://login.microsoftonline.com/2da4bdd0-d356-4d98-9a11-9baf04b24250/.well-known/openid-configuration',
        //     // or 'https://login.microsoftonline.com/<your_tenant_guid>/.well-known/openid-configuration'
        //     // or you can use the common endpoint
        //     // 'https://login.microsoftonline.com/common/.well-known/openid-configuration'

        //     // Required
        //     clientID: '0d68bfe5-1de7-4b3d-81d1-318ae0842713',

        //     // Required.
        //     // If you are using the common endpoint, you should either set `validateIssuer` to false, or provide a value for `issuer`.
        //     validateIssuer: true,

        //     // Required. 
        //     // Set to true if you use `function(req, token, done)` as the verify callback.
        //     // Set to false if you use `function(req, token)` as the verify callback.
        //     passReqToCallback: false,

        //     // Required if you are using common endpoint and setting `validateIssuer` to true.
        //     // For tenant-specific endpoint, this field is optional, we will use the issuer from the metadata by default.
        //     issuer: null,

        //     // Optional, default value is clientID
        //     audience: null,

        //     // Optional. Default value is false.
        //     // Set to true if you accept access_token whose `aud` claim contains multiple values.
        //     allowMultiAudiencesInToken: false,

        //     // Optional. 'error', 'warn' or 'info'
        //     loggingLevel: 'info',
        // };

        let creds = {
            returnURL: 'http://localhost:3000/auth/openid/return',
            identityMetadata: 'https://login.microsoftonline.com/2da4bdd0-d356-4d98-9a11-9baf04b24250/federationmetadata/2007-06/federationmetadata.xml', // For using Microsoft you should never need to change this.
            clientID: '2da4bdd0-d356-4d98-9a11-9baf04b24250',
            validateIssuer: false,
            loggingLevel: 'info',
            clientSecret: '/Y8cDCQUaSO10SbBX+WSly+EOq+/2TdvFJLH1DqUa2Q=', // if you are doing code or id_token code
            skipUserProfile: true, // for AzureAD should be set to true.
            responseType: 'id_token code', // for login only flows use id_token. For accessing resources use `id_token code`
            responseMode: 'query', // For login only flows we should have token passed back to us in a POST
            //scope: ['email', 'profile'] // additional scopes you may wish to pass
        };

        config.creds = creds;

        var options = {
            // The URL of the metadata document for your app. We will put the keys for token validation from the URL found in the jwks_uri tag of the in the metadata.
            identityMetadata: config.creds.identityMetadata,
            clientID: config.creds.clientID,
            validateIssuer: config.creds.validateIssuer,
            issuer: config.creds.issuer,
            passReqToCallback: config.creds.passReqToCallback,
            isB2C: config.creds.isB2C,
            policyName: config.creds.policyName,
            allowMultiAudiencesInToken: config.creds.allowMultiAudiencesInToken,
            audience: config.creds.audience,
            loggingLevel: config.creds.loggingLevel,
        };

        var bearerStrategy = passport(new BearerStrategy(options,
            function(token, done) {
                console.log("IMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM");
                log.info('verifying the user');
                log.info(token, 'was the token retreived');
                done(null);
                // findById(token.oid, function(err, user) {
                //     if (err) {
                //         return done(err);
                //     }
                //     if (!user) {
                //         // "Auto-registration"
                //         log.info('User was added automatically as they were new. Their oid is: ', token.oid);
                //         users.push(token);
                //         owner = token.oid;
                //         return done(null, token);
                //     }
                //     owner = token.oid;
                //     return done(null, user, token);
                // });
            }
        ));

        const azureHandler = function(request, reply) {
            console.log("innnnnnnnnnnnnn");
            // console.log(bearerStrategy);
            // passport.use(bearerStrategy);
            return bearerStrategy({
                onSuccess: function(info, request, reply) {
                    console.log(">>>>>>>>>>>>>>>>>>>>>>>", info);
                    let successUrl = request.pre.social.successUrl ? request.pre.social.successUrl : defaultSuccessUrl;
                    return reply.redirect(`${successUrl}?status=200&authHeader=${info.authHeader}&refreshToken=${info.refreshToken}`);
                },
                onError: function(error, request, reply) {
                    Log.error("<<<<<<<<<<<<<<<<<<<<<<<", error);
                    let errorUrl = request.pre.social.errorUrl ? request.pre.social.errorUrl : defaultErrorUrl;
                    return reply.redirect(`${errorUrl}?error=${error}`);
                }
            })(request, reply);

        }

        server.route({
            method: 'GET',
            path: '/login/azure',
            config: {
                handler: azureHandler,
                auth: null,
                description: 'Azure login (hit the link from browser).',
                tags: ['api', 'Social', 'Azure'],
                validate: {},
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
            },
        });
    })();
};