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

//passport
const passport = require('hapi-passport');
const LdapStrategy = require('passport-ldapauth');


module.exports = function(server, mongoose, logger) {
    (function() {
        const Log = logger.bind(Chalk.magenta("Login Ldap"));
        const AuthAttempt = mongoose.model('authAttempt');
        const Permission = mongoose.model('permission');
        const Session = mongoose.model('session');
        const User = mongoose.model('user');
        const Ldap = mongoose.model('ldap');

        Log.note("Generating Login endpoint");

        const loginPre = [
            {
                assign: "ldapconnection",
                method: function(request, reply){
                    const condition = {
                        connectionName: request.params.connector
                    }
                    Ldap.findOne(condition).then((connection)=>{
                        if(!connection){
                            return reply(Boom.badRequest("Invalid connector."));
                        }
                        return reply(connection);
                    })
                    .catch(err => reply(Boom.badImplementation("An error occured fetching the connector")));
                }
            },
            {
                assign: "strategy",
                method: function(request, reply){
                    const ldapconnection = request.pre.ldapconnection;
                    const options = {
                        server: {
                            url: ldapconnection.url,
                            bindDN: ldapconnection.bindDN,
                            bindCredentials: ldapconnection.bindCredentials,
                            searchBase: ldapconnection.searchBase,
                            searchFilter: "(uid={{username}})",
                            searchAttributes: ldapconnection.searchAttributes
                        }
                    }
                    var strategy = passport(new LdapStrategy(options, (user, done)=>{
                        done(null, user);
                    }));
                    reply(strategy);
                }
            }
        ];

        const mapProfile = function(rawData, mapping){
            let user = {};
            for(let key in mapping){
                let value = mapping[key];
                if(typeof value === "string"){
                    user[key] = rawData[value];
                } else {
                    for(let x in value){
                        user[key] = user[key] || rawData[value[x]];
                    }
                }
            }
            return user;
        }

        const handler = function(request, reply) {
            const ldapconnection = request.pre.ldapconnection;
            const strategy = request.pre.strategy;
            const defaultPwd = Config.get("/defaultPassword");
            return strategy({
                onSuccess: function(info, request, reply){
                    let response = {};
                    let user = mapProfile(info, ldapconnection.profileMapping);
                    if(user.email && user.email.constructor === Array){
                        user.email = user.email[0];
                    }
                    user.identities = {
                        ldap: {
                            id: info['objectGUID'] || info['uid'] || info['cn'] || info['entryUUID'],
                            uid: info['uid'],
                            cn: info['cn'],
                            entryUUID: info['entryUUID']
                        }
                    }
                    user.password = defaultPwd;
                    User.update({"username": user.username}, {$set: user }, {upsert: true})
                    .then(result => User.findOne({"username": user.username})
                    .then(result => {
                        if(!result){
                            return reply(Boom.notFound("Couldn't locate user."))
                        }
                        return result;
                    })
                    .then(result => Session.createInstance(result))
                    .then((session) => Token(null, session, [], expirationPeriod.long, Log)))
                    .then((refreshToken) => {
                        response.refreshToken = refreshToken;
                        return Token(user, null, [], expirationPeriod.short, Log);
                    })
                    .then(authToken => {
                        response.authHeader = 'Bearer '+ authToken;                        
                        response.user = user;
                        response.rawData = info;
                        return reply(response);
                    })
                    .catch(err => {
                        Log.error(err);
                        return reply(Boom.badImplementation("Error occured setting user record"));
                    });
                },
                onFailed: function(info, request, reply){
                    reply(Boom.unauthorized(info.message));
                    Log.warn('Ldap auth failed');
                },
                onError: function(info, request, reply){
                    reply(Boom.internal("An error occured in Ldap Auth"));
                    Log.error({error: info});
                }
            })(request, reply);
        };

        server.route({
            method: 'POST',
            path: '/login/ldap/{connector}',
            config: {
                handler: handler,
                auth: null,
                description: 'User login.',
                tags: ['api', 'Login'],
                validate: {
                    payload: {
                        username: Joi.string().required(),
                        password: Joi.string().required()
                    },
                    params: {
                        connector: Joi.string().required()
                    }
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
}