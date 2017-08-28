'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Bcrypt = require('bcryptjs');
const Chalk = require('chalk');
const Jwt = require('jsonwebtoken');
const RestHapi = require('rest-hapi');
const _ = require("underscore");

const Config = require('../../config');
const Token = require('../token');
const Twofactor = require('../utils/twofactor');

const USER_ROLES = Config.get('/constants/USER_ROLES');
const AUTH_STRATEGIES = Config.get('/constants/AUTH_STRATEGIES');
const expirationPeriod = Config.get('/expirationPeriod');
const authStrategy = Config.get('/restHapiConfig/authStrategy');

//Passport Middlewares
const passport = require('hapi-passport');
const GitHubStrategy = require('passport-github');
const GoogleStrategy = require('passport-google-oauth2');
const FacebookStrategy = require('passport-facebook');
const TwitterStrategy = require('passport-twitter');
const InstagramStrategy = require('passport-instagram');
const LinkedInStrategy = require('passport-linkedin');
const DropboxOAuth2Strategy = require('passport-dropbox-oauth2');

const UserOperations = require('../utils/user');
const clientURL = Config.get('/clientURL');
const defaultSuccessUrl = Config.get('/defaultSuccessURL');;
const defaultErrorUrl = Config.get('/defaultErrorURL');
const saml2 = require('saml2-js');
const fs = require('fs');

module.exports = function(server, mongoose, logger) {

    // Login Endpoint
    (function() {
        const Log = logger.bind(Chalk.magenta("Login"));
        const AuthAttempt = mongoose.model('authAttempt');
        const Permission = mongoose.model('permission');
        const Session = mongoose.model('session');
        const User = mongoose.model('user');

        Log.note("Generating Login endpoint");

        const loginPre = [{
                assign: 'primarykey',
                method: function(request, reply) {
                    return reply(Config.get('/loginWith')[0]);
                }
            }, {
                assign: 'isValid',
                method: function(request, reply) {
                    const key = request.pre.primarykey; //key using which login is set
                    if (!request.payload[key]) {
                        return reply(Boom.badRequest(`Application is configured to use ${key}, which is missing.`));
                    }
                    return reply();
                }
            }, {
                assign: 'abuseDetected',
                method: function(request, reply) {
                    const key = request.pre.primarykey
                    const ip = request.info.remoteAddress;
                    const logonid = request.payload[key];

                    AuthAttempt.abuseDetected(ip, logonid, Log)
                        .then(function(detected) {
                            if (detected) {
                                return reply(Boom.badRequest('Maximum number of auth attempts reached. Please try again later.'));
                            }
                            return reply();
                        })
                        .catch(function(error) {
                            Log.error(error);
                            return reply(Boom.gatewayTimeout('An error occurred.'));
                        });
                }
            },
            {
                assign: 'user',
                method: function(request, reply) {
                    const key = Config.get('/loginWith')[0];
                    const value = request.payload[key];
                    const password = request.payload.password;

                    User.findByGivenKey(key, value, password, Log)
                        .then(function(user) {
                            return reply(user);
                        })
                        .catch(function(error) {
                            Log.error(error);
                            return reply(Boom.gatewayTimeout('An error occurred.'));
                        });
                }
            },
            {
                assign: 'logAttempt',
                method: function(request, reply) {
                    const key = request.pre.primarykey
                    if (request.pre.user) {
                        return reply();
                    }

                    const ip = request.info.remoteAddress;
                    const logonid = request.payload[key];

                    AuthAttempt.createInstance(ip, logonid, Log)
                        .then(function(authAttempt) {
                            return reply(Boom.badRequest('Invalid Email or Password.'));
                        })
                        .catch(function(error) {
                            Log.error(error);
                            return reply(Boom.gatewayTimeout('An error occurred.'));
                        });
                }
            },
            {
                assign: 'isActive',
                method: function(request, reply) {

                    if (request.pre.user.isActive) {
                        return reply();
                    } else {
                        return reply(Boom.badRequest('Account is inactive.'));
                    }
                }
            },
            {
                assign: 'session',
                method: function(request, reply) {
                    if (authStrategy === AUTH_STRATEGIES.TOKEN) {
                        reply(null);
                    } else {
                        Session.createInstance(request.pre.user)
                            .then(function(session) {
                                return reply(session);
                            })
                            .catch(function(error) {
                                Log.error(error);
                                return reply(Boom.gatewayTimeout('An error occurred.'));
                            });
                    }
                }
            },
            {
                assign: 'scope',
                method: function(request, reply) {
                    return Permission.getScope(request.pre.user, Log)
                        .then(function(scope) {
                            return reply(scope);
                        });
                }
            },
            {
                assign: 'twofactor',
                method: function(request, reply){
                    const isAllowed = Config.get('/twoFA');
                    if(!isAllowed){
                        return reply(false);
                    }
                    let user = request.pre.user;
                    if(request.pre.user.twofactor && request.pre.user.twofactor.enabled === true){
                        if(request.headers["x-otp"]){
                            return reply(user.twofactor.strategy);
                        } else {
                            //set otp for standard implementation
                            switch (user.twofactor.strategy){
                                case 'standard':
                                    //generate otp
                                    //save otp
                                    //send otp
                                    const key = request.pre.primarykey
                                    const value = request.payload[key];
                                    User.setOtp(key, value, Log)
                                    .then((result)=> { 
                                        return Twofactor.sendOtp(user.email, user.phone_number, result.otp, result.otpExp, Log);
                                    })
                                    .then(()=>{
                                        return reply({twofactor: true, message: `An OTP is sent to ${user.email} & ${user.phone_number}`}).code(203).takeover();
                                    })
                                    .catch((err)=>{
                                        Log.error(err);
                                        return reply(Boom.internal(err));
                                    });
                                break;
                                case 'totp':
                                    return reply({twofactor: true, message: "Please enter otp to continue."}).code(203).takeover();
                                break;
                            }
                        }
                    } else {
                        reply(false);
                    }
                }
            },
            {
                assign: 'validateOtp',
                method: function(request, reply){
                    //EXPL: If 2fa not enabled, pass.
                    if(!request.pre.twofactor){
                        return reply();
                    }
                    const user  = request.pre.user;
                    const strategy = user.twofactor.strategy;
                    const otp = request.headers["x-otp"];
                    const verfied = Twofactor.verifyOtp(user, strategy, otp, Log);
                    if(verfied){
                        reply(true);
                    } else {
                        reply(Boom.badRequest("Invalid OTP."))
                    }
                }
            },
            {
                assign: 'invalidateOtp',
                method: function(request, reply){
                    //EXPL: If 2fa not enabled, pass.
                    if(!request.pre.twofactor){
                        return reply();
                    }
                    const conditions = {
                        verified: request.pre.vaidateOtp,
                        strategy: request.pre.twofactor
                    }
                    if(!!conditions.strategy && conditions.strategy === 'standard'){
                        const key = request.pre.primarykey;
                        const value = request.payload[key];
                        User.unSetOtp(key, value, Log).then(()=>{
                            return reply(true);
                        })
                        .catch((err)=>{
                            Log.error(err);
                            return reply(Boom.internal(err));
                        });
                    } else {
                        reply();
                    }
                }
            },
            {
                assign: 'standardToken',
                method: function(request, reply) {
                    switch (authStrategy) {
                        case AUTH_STRATEGIES.TOKEN:
                            reply(Token(request.pre.user, null, request.pre.scope, expirationPeriod.long, Log));
                            break;
                        case AUTH_STRATEGIES.SESSION:
                            reply(null);
                            break;
                        case AUTH_STRATEGIES.REFRESH:
                            reply(Token(request.pre.user, null, request.pre.scope, expirationPeriod.short, Log));
                            break;
                        default:
                            break;
                    }
                }
            },
            {
                assign: 'sessionToken',
                method: function(request, reply) {
                    switch (authStrategy) {
                        case AUTH_STRATEGIES.TOKEN:
                            reply(null);
                            break;
                        case AUTH_STRATEGIES.SESSION:
                            reply(Token(null, request.pre.session, request.pre.scope, expirationPeriod.long, Log));
                            break;
                        case AUTH_STRATEGIES.REFRESH:
                            reply(null);
                            break;
                        default:
                            break;
                    }
                }
            },
            {
                assign: 'refreshToken',
                method: function(request, reply) {
                    switch (authStrategy) {
                        case AUTH_STRATEGIES.TOKEN:
                            reply(null);
                            break;
                        case AUTH_STRATEGIES.SESSION:
                            reply(null);
                            break;
                        case AUTH_STRATEGIES.REFRESH:
                            reply(Token(null, request.pre.session, request.pre.scope, expirationPeriod.long, Log));
                            break;
                        default:
                            break;
                    }
                }
            }
        ];
        const headersValidation = Joi.object({
            'x-otp': Joi.number()
        }).options({ allowUnknown: true });

        const loginHandler = function(request, reply) {

            let authHeader = "";
            let response = {};

            request.pre.user.password = "";
            delete request.pre.user.twofactor;

            switch (authStrategy) {
                case AUTH_STRATEGIES.TOKEN:
                    authHeader = 'Bearer ' + request.pre.standardToken;
                    response = {
                        user: request.pre.user,
                        authHeader,
                        scope: request.pre.scope
                    };
                    break;
                case AUTH_STRATEGIES.SESSION:
                    authHeader = 'Bearer ' + request.pre.sessionToken;
                    response = {
                        user: request.pre.user,
                        authHeader,
                        scope: request.pre.scope
                    };
                    break;
                case AUTH_STRATEGIES.REFRESH:
                    authHeader = 'Bearer ' + request.pre.standardToken;
                    response = {
                        user: request.pre.user,
                        refreshToken: request.pre.refreshToken,
                        authHeader,
                        scope: request.pre.scope
                    };
                    break;
                default:
                    break;
            }

            return reply(response);
        };

        server.route({
            method: 'POST',
            path: '/login',
            config: {
                handler: loginHandler,
                auth: null,
                description: 'User login.',
                tags: ['api', 'Login'],
                validate: {
                    payload: {
                        username: Joi.string().lowercase(),
                        phonenumber: Joi.string(),
                        email: Joi.string().email().lowercase(),
                        password: Joi.string().required()
                    },
                    headers: headersValidation
                },
                pre: loginPre,
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
    }());

    //social login Endpoint
    (function() {
        const Log = logger.bind(Chalk.magenta("LoginSocial"));
        const AuthAttempt = mongoose.model('authAttempt');
        const User = mongoose.model('user');
        const Role = mongoose.model('role');
        const Permission = mongoose.model('permission');
        const userOperations = new UserOperations();

        /**
         * initialize provider for social login 
         * @function
         * @param {string} provider - social login provider name ex.google
         * @param {instance} strategy - passport strategy
         * @param {object} credentials - provider app credentials 
         */
        function initSocial(provider, strategy, credentials) {
            return passport(new strategy(credentials, function verify(accessToken, refreshToken, profile, verified) {

                let userdata = {
                    email: profile.emails[0].value || '',
                    id: profile.id,
                    username: profile.username || '',
                    name: profile.displayName || '',
                    gravatar_id: profile.gravatar_id || '',
                    provider: profile.provider || '',
                    photo: profile.photos[0].value
                }
                userOperations.processSocialLogin(userdata, Log)
                    .then(finaldata => verified(null, finaldata))
                    .catch(error => verified(error));
            }));
        }

        /**
         * checks for provider settings are present in database or not! 
         * @function 
         */
        const socialLoginPre = [{
            assign: 'social',
            method: (request, reply) => {
                userOperations.getSocialLoginAppCredentials(request.params.provider)
                    .then(result => {
                        if (result) {
                            return reply(result);
                        } else {
                            // return reply.redirect(`${defaultErrorUrl}?error=Invalid provider`);
                            reply(Boom.notFound("Not Found"));
                        }
                    })
                    .catch(error => Boom.gatewayTimeout('An error occurred.'));
            }
        }];

        /**
         * provides the strategy instance of requested provider!  
         * @function
         * @param {string} provider - social login provider name ex.google
         */
        function getSocialStrategy(provider) {
            switch (provider) {
                case "google":
                    return GoogleStrategy;
                    break;
                case "github":
                    return GitHubStrategy;
                    break;
                case "facebook":
                    return FacebookStrategy;
                    break;
                case "twitter":
                    return TwitterStrategy;
                    break;
                case "instagram":
                    return InstagramStrategy;
                    break;
                case "linkedin":
                    return LinkedInStrategy;
                    break;
                default:
                    return "NO_STRATEGY";
                    break;
            }
        }

        function socialLoginHandler(request, reply) {
            let credentials = {};
            if (["twitter", "linkedin"].indexOf(request.params.provider) > -1) {
                credentials = {
                    consumerKey: request.pre.social.clientid || "CONSUMER_KEY",
                    consumerSecret: request.pre.social.clientsecret || "CONSUMER_SECRET",
                    callbackURL: `${clientURL}/login/${request.params.provider}`,
                    scope: request.pre.social.scope || []
                };
            } else {
                credentials = {
                    clientID: request.pre.social.clientid || "CONSUMER_KEY",
                    clientSecret: request.pre.social.clientsecret || "CONSUMER_SECRET",
                    callbackURL: `${clientURL}/login/${request.params.provider}`,
                    scope: request.pre.social.scope || []
                };
            }
            let socialStrategy = initSocial(request.pre.social.name, getSocialStrategy(request.pre.social.name), credentials);

            return socialStrategy({
                onSuccess: function(info, request, reply) {
                    let successUrl = request.pre.social.successUrl ? request.pre.social.successUrl : defaultSuccessUrl;
                    return reply.redirect(`${successUrl}?status=200&authHeader=${info.authHeader}&refreshToken=${info.refreshToken}`);
                },
                onError: function(error, request, reply) {
                    Log.error(error);
                    let errorUrl = request.pre.social.errorUrl ? request.pre.social.errorUrl : defaultErrorUrl;
                    return reply.redirect(`${errorUrl}?error=${error}`);
                }
            })(request, reply);

        }
        server.route({
            method: 'GET',
            path: '/login/{provider}',
            config: {
                handler: socialLoginHandler,
                auth: null,
                description: 'User login via google',
                tags: ['api', 'Login'],
                pre: socialLoginPre,
                plugins: {}
            },
        });
    }());

    // Forgot Password Endpoint
    (function() {
        const Log = logger.bind(Chalk.magenta("Forgot Password"));
        const User = mongoose.model('user');
        const Session = mongoose.model('session');

        Log.note("Generating Forgot Password endpoint");

        const forgotPasswordPre = [{
            assign: 'user',
            method: function(request, reply) {

                const conditions = {
                    email: request.payload.email
                };

                User.findOne(conditions)
                    .then(function(user) {
                        if (!user) {
                            return reply({ message: 'Success.' }).takeover();
                        }
                        return reply(user);
                    })
                    .catch(function(error) {
                        Log.error(error);
                        return reply(Boom.badImplementation('There was an error accessing the database.'));
                    });
            }
        }];

        const forgotPasswordHandler = function(request, reply) {

            const mailer = request.server.plugins.mailer;

            let keyHash = {};
            let user = {};

            Session.generateKeyHash(Log)
                .then(function(result) {
                    keyHash = result;

                    const _id = request.pre.user._id.toString();
                    const update = {
                        resetPassword: {
                            token: keyHash.hash,
                            expires: Date.now() + 10000000
                        }
                    };

                    return RestHapi.update(User, _id, update);
                })
                .then(function(result) {
                    user = result;

                    const firstName = user.firstName ? user.firstName : null;
                    const lastName = user.lastName ? user.lastName : null;

                    const emailOptions = {
                        subject: 'Reset your ' + Config.get('/websiteName') + ' password',
                        to: {
                            name: firstName + " " + lastName,
                            address: request.payload.email
                        }
                    };

                    const template = 'forgot-password';

                    const token = Jwt.sign({
                        email: request.payload.email,
                        key: keyHash.key
                    }, Config.get('/jwtSecret'), { algorithm: 'HS256', expiresIn: "4h" }); //TODO: match expiration with activateAccount expiration

                    const context = {
                        clientURL: Config.get('/clientURL'),
                        websiteName: Config.get('/websiteName'),
                        key: token
                    };

                    return mailer.sendEmail(emailOptions, template, context, Log);
                })
                .then(function(result) {
                    return reply({ message: 'Success.' });
                })
                .catch(function(error) {
                    Log.error(error);
                    return reply(Boom.gatewayTimeout('An error occurred.'));
                });
        };

        server.route({
            method: 'POST',
            path: '/login/forgot',
            config: {
                handler: forgotPasswordHandler,
                auth: null,
                description: 'Forgot password.',
                tags: ['api', 'Login', 'Forgot Password'],
                validate: {
                    payload: {
                        email: Joi.string().email().required()
                    }
                },
                pre: forgotPasswordPre,
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


    // Reset Password Endpoint
    (function() {
        const Log = logger.bind(Chalk.magenta("Reset Password"));
        const User = mongoose.model('user');

        Log.note("Generating Reset Password endpoint");

        const resetPasswordPre = [{
                assign: 'decoded',
                method: function(request, reply) {

                    Jwt.verify(request.payload.token, Config.get('/jwtSecret'), function(err, decoded) {
                        if (err) {
                            return reply(Boom.badRequest('Invalid email or key.'));
                        }

                        return reply(decoded);
                    });
                }
            },
            {
                assign: 'user',
                method: function(request, reply) {

                    const conditions = {
                        email: request.pre.decoded.email,
                        'resetPassword.expires': { $gt: Date.now() }
                    };

                    User.findOne(conditions)
                        .then(function(user) {
                            if (!user) {
                                return reply(Boom.badRequest('Invalid email or key.'));
                            }
                            return reply(user);
                        })
                        .catch(function(error) {
                            Log.error(error);
                            return reply(Boom.badImplementation('There was an error accessing the database.'));
                        });
                }
            }
        ];

        const resetPasswordHandler = function(request, reply) {

            const key = request.pre.decoded.key;
            const token = request.pre.user.resetPassword.token;
            Bcrypt.compare(key, token)
                .then(function(keyMatch) {
                    if (!keyMatch) {
                        return reply(Boom.badRequest('Invalid email or key.'));
                    }

                    return User.generatePasswordHash(request.payload.password, Log);
                })
                .then(function(passwordHash) {

                    const _id = request.pre.user._id.toString();
                    const update = {
                        $set: {
                            password: passwordHash.hash
                        },
                        $unset: {
                            resetPassword: undefined
                        }
                    };

                    return RestHapi.update(User, _id, update);
                })
                .then(function(result) {
                    return reply({ message: 'Success.' });
                })
                .catch(function(error) {
                    Log.error(error);
                    return reply(Boom.gatewayTimeout('An error occurred.'));
                });
        };

        server.route({
            method: 'POST',
            path: '/login/reset',
            config: {
                handler: resetPasswordHandler,
                auth: null,
                description: 'Reset password.',
                tags: ['api', 'Login', 'Reset Password'],
                validate: {
                    payload: {
                        token: Joi.string().required(),
                        password: Joi.string().required()
                    }
                },
                pre: resetPasswordPre,
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

    // Two factor Auth OTP validation
    (function() {
        const Log = logger.bind(Chalk.magenta("Validate OTP"));
        const User = mongoose.model('user');

        Log.note("Generating OTP validation End Point!");

        const accountActivationHandler = function(request, reply) {
            return reply({
                "user": {
                    "_id": "595df5fd39d73c2147c2852e",
                    "firstName": "root",
                    "lastName": "admin",
                    "email": "admin@gmail.com",
                    "username": "admin@gmail.com",
                    "password": "",
                    "role": "595df5fd39d73c2147c28522",
                    "createdAt": "2017-07-06T08:34:05.858Z",
                    "updatedAt": "2017-07-06T08:34:05.858Z",
                    "isDeleted": false,
                    "permissions": [],
                    "groups": [],
                    "isActive": true,
                    "email_verified": false,
                    "phone_verified": false,
                    "__v": 0
                },
                "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI1OTYzNjNhZWQ2YmJiNjQyNWMzNWMwMjIiLCJzZXNzaW9uS2V5IjoiYTg1OGQ0ZDctM2NmOS00NTU4LTlkMWQtMDYyNzBhZTMwZjNhIiwicGFzc3dvcmRIYXNoIjoiJDJhJDEwJGNCbWhNMGs3WVVRV0lEaGxpWlhqTk9mWHdBbVBzeUZEMUh5Tk1HRnR5S05WVG1wNmJjZjYyIiwic2NvcGUiOlsiQWRtaW4iLCJyb290Il0sImlhdCI6MTQ5OTY4NTgwNiwiZXhwIjoxNDk5NzAwMjA2fQ.I-gQ-L8w-_bYf2MQt9Bq1MrEfoLqo-fXJSRk-aZn3UM",
                "authHeader": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImZpcnN0TmFtZSI6InJvb3QiLCJsYXN0TmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBnbWFpbC5jb20iLCJyb2xlIjoiNTk1ZGY1ZmQzOWQ3M2MyMTQ3YzI4NTIyIiwiY3JlYXRlZEF0IjoiMjAxNy0wNy0wNlQwODozNDowNS44NThaIiwidXBkYXRlZEF0IjoiMjAxNy0wNy0wNlQwODozNDowNS44NThaIn0sInNjb3BlIjpbIkFkbWluIiwicm9vdCJdLCJpYXQiOjE0OTk2ODU4MDYsImV4cCI6MTQ5OTY4NjQwNn0.lWauPGzNnlh3LpvaOALPNyuBkEkHrIoFbxY7kx5L1nE",
                "scope": [
                    "Admin",
                    "root"
                ]
            });
        };

        server.route({
            method: 'GET',
            path: '/login/validateotp',
            config: {
                handler: accountActivationHandler,
                auth: null,
                description: 'User account activation.',
                tags: ['api', 'Two factor Authentication'],
                validate: {
                    query: {
                        token: Joi.string().required()
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

    //SSO authentication
    (function() {
        const Log = logger.bind(Chalk.magenta("SSO"));
        const userOperations = new UserOperations();

        /**
         * checks for provider settings are present in database or not! 
         * @function 
         */
        const samlLoginPre = [{
            assign: 'saml',
            method: (request, reply) => {
                userOperations.getSamlLoginAppCredentials(request.params.provider, Log)
                    .then(result => {
                        if (result) {
                            return reply(result);
                        } else {
                            reply(Boom.notFound("Not Found"));
                        }
                    })
                    .catch(error => Boom.gatewayTimeout('An error occurred.'));
            }
        }];

        server.route({
            method: 'GET',
            path: `/login/sso/{provider}/metadata.xml`,
            config: {
                handler: (request, reply) => {
                    userOperations.initProvider('sp', request.pre.saml, clientURL)
                        .then(sp => {
                            reply(sp.create_metadata()).type('application/xml');
                        })
                        .catch(error => {
                            Log.error(error);
                            reply(Boom.badImplementation("Internal server error!"));
                        });
                },
                auth: null,
                description: 'SSO metadata xml',
                tags: ['api', 'Login', 'SSO'],
                pre: samlLoginPre,
                plugins: {}
            },
        });


        server.route({
            method: 'GET',
            path: `/login/sso/{provider}`,
            config: {
                handler: (request, reply) => {
                    let sp, idp;
                    userOperations.initProvider('sp', request.pre.saml, clientURL)
                        .then(result => {
                            sp = result;
                            return;
                        })
                        .then(_ => userOperations.initProvider('idp', request.pre.saml, clientURL))
                        .then(result => {
                            idp = result;
                            return;
                        })
                        .then(_ => new Promise((resolve, reject) => {
                            sp.create_login_request_url(idp, {}, (err, login_url, request_id) => {
                                if (err != null)
                                    return reject();
                                reply.redirect(login_url);
                            });
                        }))
                        .catch(error => {
                            Log.error(error);
                            reply(Boom.badImplementation("Internal server error!"));
                        });
                },
                auth: null,
                description: 'SSO metadata xml',
                tags: ['api', 'Login', 'SSO'],
                pre: samlLoginPre,
                plugins: {}
            },
        });

        server.route({
            method: 'post',
            path: `/login/sso/{provider}/assert`,
            config: {
                handler: (request, reply) => {
                    var options = { request_body: request.payload };
                    var sp, idp;
                    userOperations.initProvider('sp', request.pre.saml, clientURL)
                        .then(result => {
                            sp = result;
                            return;
                        })
                        .then(_ => userOperations.initProvider('idp', request.pre.saml, clientURL))
                        .then(result => {
                            idp = result;
                            return;
                        })
                        .then(_ => new Promise((resolve, reject) => {
                            sp.post_assert(idp, options, (error, saml_response) => {
                                if (error)
                                    return reject();
                                var mapping = request.pre.saml.sso_response_mapping;
                                var userdata = {
                                    "email": eval(`saml_response.${mapping.email}`),
                                    "id": eval(`saml_response.${mapping.id}`),
                                    "firstName": eval(`saml_response.${mapping.firstName}`),
                                    "lastName": eval(`saml_response.${mapping.lastName}`),
                                    "provider": mapping.provider
                                };
                                return resolve(userdata);
                            });
                        }))
                        .then(userdata => userOperations.processSocialLogin(userdata, Log))
                        .then(finaldata => {
                            let successUrl = request.pre.saml.successUrl ? request.pre.saml.successUrl : defaultSuccessUrl;
                            return reply.redirect(`${successUrl}?status=200&authHeader=${finaldata.authHeader}&refreshToken=${finaldata.refreshToken}`);
                        })
                        .catch(error => {
                            Log.error(error);
                            let errorUrl = request.pre.saml.errorUrl ? request.pre.saml.errorUrl : defaultErrorUrl;
                            return reply.redirect(`${errorUrl}?error=${error}`);
                        });
                },
                auth: null,
                description: 'SSO metadata xml',
                tags: ['api', 'Login', 'SSO'],
                pre: samlLoginPre,
                plugins: {}
            },
        });
    }());
};