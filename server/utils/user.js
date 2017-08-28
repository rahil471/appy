'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Bcrypt = require('bcryptjs');
const Chalk = require('chalk');
const Jwt = require('jsonwebtoken');
const RestHapi = require('rest-hapi');

const Config = require('../../config');
const Token = require('../token');

const USER_ROLES = Config.get('/constants/USER_ROLES');
const AUTH_STRATEGIES = Config.get('/constants/AUTH_STRATEGIES');
const expirationPeriod = Config.get('/expirationPeriod');
const authStrategy = Config.get('/restHapiConfig/authStrategy');

const mongoose = require('mongoose');
const AuthAttempt = mongoose.model('authAttempt');
const User = mongoose.model('user');
const Role = mongoose.model('role');
const Permission = mongoose.model('permission');
const Social = mongoose.model('connection/social');
const Saml = mongoose.model('saml');

const saml2 = require('saml2-js');

/**
 *Class for all Social login operationas
 * @class
 */
class UserOperations {
    constructor() {}

    /**
     * Registring New User Comming from Social Login
     * @function
     * @param {object} userdata - userdata got from social login provider
     * @param {instance} Log - log instance 
     */
    registerNewUserSocial(userdata, Log) {
        return Role.findOne({ "name": "User" })
            .then(role => !!role ? role : Boom.conflict('User Role doesn\'t exist.'))
            .then(role => {
                let user = {};
                user.firstName = userdata.name || userdata.email.substring(0, userdata.email.lastIndexOf("@"));
                user.lastName = '';
                user.email = userdata.email;
                user.username = userdata.email;
                user.photo = userdata.photo || "";
                user.password = "NOTSET";
                user.role = role._id;
                user.isActive = true;
                user.identities = user.identities || {};
                user.identities[userdata.provider] = { id: userdata.id };
                return user;
            })
            .then(user => User.create(user))
            .then(result => {
                Log.note("user created successful ->" + result._id);
                return result._id
            })
            .catch(error => {
                Log.error(error);
                return error;
            });
    }

    /**
     * Since user found, update user's social id/status and some details which we don't have in our system
     * @function
     * @param {object} user - user data from database
     * @param {object} userdata - userdata got from social login provider
     * @param {instance} Log - log instance 
     */
    updateSocial(user, userdata, Log) {

        user.firstName = user.firstName ? user.firstName : userdata.firstName;
        user.lastName = user.lastName ? user.lastName : userdata.lastName;
        user.username = user.username ? user.username : userdata.email;
        user.photo = user.photo ? user.photo : userdata.photo;
        user.identities = user.identities || {};
        user.identities[userdata.provider] = { id: userdata.id };

        return User.update({ _id: user._id }, { $set: { "identities": user.identities } })
            .then(result => result ? user._id : {})
            .catch(error => {
                console.log(error);
                return error;
            });
    }

    /**
     * Register user from Social account who is already logged in before by some other login provider/method
     * @function
     * @param {object} user - user data from database
     * @param {object} userdata - userdata got from social login provider
     * @param {instance} Log - log instance 
     */
    registerExistingUserSocial(user, userdata, Log) {
        let checkUserForSocial = new Promise(function(resolve, reject) {
            (user.identities && user.identities[userdata.provider] && user.identities[userdata.provider].id) ? resolve(true): resolve(false);
        });

        return checkUserForSocial
            .then(check => check ? user._id : this.updateSocial(user, userdata, Log))
            .catch(error => error);
    }

    /**
     * Generate Token
     * @function
     * @param {object} userId - mongoose id (_id) of user 
     * @param {instance} Log - log instance 
     */
    generateToken(userId, Log) {
        let response = {
            user: "",
            refreshToken: "",
            authHeader: "",
            scope: []
        }

        return User.findOne({ _id: userId }, { password: 0 })
            .then(result => {
                response.user = result;
                return null;
            })
            .then(_ => Permission.getScope(response.user, Log))
            .then(scope => { response.scope = scope; return null; })
            .then(_ => {
                let authHeader = 'Bearer ' + Token(response.user, null, response.scope, expirationPeriod.short, Log);
                response.authHeader = authHeader;
                return null;
            })
            .then(_ => {
                response.refreshToken = Token(response.user, null, response.scope, expirationPeriod.short, Log);
                return response;
            })
            .catch(error => error);
    }

    /**
     * Get Social Login app credentials  
     * @function
     * @param {string} provider - social login provider ex.google
     * @param {instance} Log - log instance 
     */
    getSocialLoginAppCredentials(provider, Log) {
        return Social.findOne({ "name": provider, "isDeleted": false })
            .then(result => result)
            .catch(error => error);
    }

    /**
     * check user,Register/Update user, generate token and return the final result of social login 
     * @function
     * @param {object} userdata - userdata got from social login provider
     * @param {instance} Log - log instance 
     */
    processSocialLogin(userdata, Log) {
        return User.findOne({ "email": userdata.email })
            .then(user => user ? this.registerExistingUserSocial(user, userdata, Log) : this.registerNewUserSocial(userdata, Log))
            .then(userId => this.generateToken(userId, Log))
            .then(finaldata => finaldata)
            .catch(error => {
                Log.error(error);
                return error;
            });
    }

    /**
     * Get SAML Login app credentials  
     * @function
     * @param {string} provider - social login provider ex.google
     * @param {instance} Log - log instance 
     */
    getSamlLoginAppCredentials(provider, Log) {
        let selectData = "provider metadata_secrete sso_login_url sso_logout_url certificates private_key sso_response_mapping force_authn";
        return Saml.findOne({ "provider": provider, "isDeleted": false }, selectData)
            .then(result => result)
            .catch(error => error);
    }

    /**
     * Configer ServiceProvider and IdentityProvider 
     * @function 
     */
    initProvider(providerType, configData, clientURL) {
        return new Promise((resolve, reject) => {
            const schema = Joi.object().keys({
                provider: Joi.string().required(),
                metadata_secrete: Joi.string().required(),
                sso_login_url: Joi.string().required(),
                sso_logout_url: Joi.string().required(),
                certificates: Joi.string().required(),
                private_key: Joi.string().required(),
                sso_response_mapping: Joi.object().keys({
                    email: Joi.string().required(),
                    id: Joi.string().required(),
                    firstName: Joi.string().required(),
                    lastName: Joi.string().required(),
                })
            }).unknown().allow();

            Joi.validate(configData, schema, (error) => {

                if (error) {
                    Log.error(error.message)
                    return reject(error);
                }
                let provider = configData.provider;
                let metadata_secrete = configData.metadata_secrete;
                let sso_login_url = configData.sso_login_url;
                let sso_logout_url = configData.sso_logout_url;
                let certificates = configData.certificates;
                let private_key = configData.private_key;
                let nameid_format = configData.nameid_format || null;
                let allow_unencrypted_assertion = configData.allow_unencrypted_assertion || true;

                if (providerType === 'sp') {
                    let sp_options = {
                        entity_id: `${clientURL}/login/sso/${provider}/metadata.xml`,
                        private_key: private_key,
                        certificate: certificates,
                        assert_endpoint: `${clientURL}/login/sso/${provider}/assert`,
                        nameid_format: nameid_format,
                        allow_unencrypted_assertion: allow_unencrypted_assertion
                    };

                    resolve(new saml2.ServiceProvider(sp_options));
                } else if (providerType === 'idp') {
                    let idp_options = {
                        sso_login_url: sso_login_url,
                        sso_logout_url: sso_logout_url,
                        certificates: certificates,
                        allow_unencrypted_assertion: allow_unencrypted_assertion
                    };
                    resolve(new saml2.IdentityProvider(idp_options));
                } else {
                    return reject("provider Type not found")
                }
            })

        });
    }
}

module.exports = UserOperations;