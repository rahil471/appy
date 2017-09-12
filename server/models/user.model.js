'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Bcrypt = require('bcryptjs');
const Chalk = require('chalk');
const custUserSchema = require("../../cust-schema").user;

module.exports = function(mongoose) {
    const modelName = "user";
    const Types = mongoose.Schema.Types;
    const userSchemaObj = {
        firstName: {
            type: Types.String,
            required: true
        },
        lastName: {
            type: Types.String,
            required: false
        },
        picture: {
            type: Types.String,
            required: false
        },
        username: {
            type: Types.String,
            required: true,
            unique: true,
            allowOnUpdate: false
        },
        password: {
            type: Types.String,
            exclude: true,
            allowOnUpdate: false
        },
        phone_number: {
            type: Types.Number,
            required: false
        },
        phone_verified: {
            type: Types.Boolean,
            allowOnCreate: false,
            allowOnUpdate: false,
            default: false
        },
        email: {
            type: Types.String,
            required: true,
            unique: true
        },
        email_verified: {
            type: Types.Boolean,
            allowOnCreate: false,
            allowOnUpdate: false,
            default: false
        },
        last_ip: {
            type: Types.String,
            allowOnCreate: false,
            allowOnUpdate: false,
            required: false
        },
        last_login: {
            type: Types.String,
            allowOnCreate: false,
            allowOnUpdate: false,
            required: false
        },
        logins_count: {
            type: Types.Number,
            allowOnCreate: false,
            allowOnUpdate: false,
            required: false
        },
        user_metadata: {
            type: Types.Object,
            required: false
        },
        isActive: {
            type: Types.Boolean,
            allowOnUpdate: false,
            default: false
        },
        opt: {
            type: Types.String,
            allowOnCreate: false,
            allowOnUpdate: false,
            required: false
        },
        opt_secretkey: {
            type: Types.String,
            allowOnCreate: false,
            allowOnUpdate: false,
            required: false
        },
        role: {
            type: Types.ObjectId,
            ref: "role"
        },
        identities: {
            type: Types.Object,
            exclude: true,
            ldap: {
                id: {
                    type: Types.String,
                    required: false,
                    index:true
                }
            },
            local: {
                id: {
                    type: Types.String,
                    required: false,
                    index:true
                }
            }
        },
        resetPassword: {
            token: {
                allowOnCreate: false,
                allowOnUpdate: false,
                exclude: true,
                type: Types.String
            },
            expires: {
                allowOnCreate: false,
                allowOnUpdate: false,
                exclude: true,
                type: Types.Date
            }
        },
        twofactor: {
            strategy: {
                type: Types.String,
                exclude: true,
                allowOnCreate: false,
                allowOnUpdate: false
            },
            totp: {
                tempSecret:{
                    type: Types.String,
                    exclude: true,
                    allowOnCreate: false,
                    allowOnUpdate: false
                },
                secret:{
                    type: Types.String,
                    exclude: true,
                    allowOnCreate: false,
                    allowOnUpdate: false
                },
                dataUrl:{
                    type: Types.String,
                    exclude: true,
                    allowOnCreate: false,
                    allowOnUpdate: false
                },
                otpauthUrl:{
                    type: Types.String,
                    exclude: true,
                    allowOnCreate: false,
                    allowOnUpdate: false
                }
            },
            enabled: {
                type: Types.Boolean,
                exclude: true,
                allowOnCreate: false,
                allowOnUpdate: false
            },
            standard: {
                otp: {
                    type: Types.String,
                    exclude: true,
                    allowOnCreate: false,
                    allowOnUpdate: false
                },
                otpExp: {
                    type: Types.String,
                    exclude: true,
                    allowOnCreate: false,
                    allowOnUpdate: false
                }
            }
        },
        activateAccount: {
            token: {
                allowOnCreate: false,
                allowOnUpdate: false,
                exclude: true,
                type: Types.String
            },
            expires: {
                allowOnCreate: false,
                allowOnUpdate: false,
                exclude: true,
                type: Types.Date
            }
        }
    };
    // Object.assign(userSchemaObj, custUserSchema);

    const Schema = new mongoose.Schema(userSchemaObj, { collection: modelName, strict: false });

    Schema.statics = {
        collectionName: modelName,
        routeOptions: {
            associations: {
                role: {
                    type: "MANY_ONE",
                    model: "role"
                },
                groups: {
                    type: "MANY_MANY",
                    alias: "group",
                    model: "group"
                },
                permissions: {
                    type: "MANY_MANY",
                    alias: "permission",
                    model: "permission",
                    linkingModel: "user_permission"
                }
            },
            extraEndpoints: [
                // Check Email Endpoint
                function(server, model, options, Log) {
                    Log = Log.bind(Chalk.magenta("Check Email"));
                    const User = model;

                    const collectionName = model.collectionDisplayName || model.modelName;

                    Log.note("Generating Check Email endpoint for " + collectionName);

                    const checkEmailHandler = function(request, reply) {

                        User.findOne({ email: request.payload.email })
                            .then(function(result) {
                                if (result) {
                                    Log.log("Email already exists.");
                                    return reply(true);
                                } else {
                                    Log.log("Email doesn't exist.");
                                    return reply(false);
                                }
                            })
                            .catch(function(error) {
                                Log.error(error);
                                return reply(Boom.badImplementation('There was an error accessing the database.'));
                            });
                    };

                    server.route({
                        method: 'POST',
                        path: '/user/check-email',
                        config: {
                            handler: checkEmailHandler,
                            auth: null,
                            description: 'User check email.',
                            tags: ['api', 'User', 'Check Email'],
                            validate: {
                                payload: {
                                    email: Joi.string().email().required()
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
                },
            ],
            create: {
                pre: function(payload, Log) {

                    return mongoose.model('user').generatePasswordHash(payload.password, Log)
                        .then(function(hashedPassword) {
                            payload.password = hashedPassword.hash;
                            return payload;
                        });
                }
            }
        },

        generatePasswordHash: function(password, Log) {

            return Bcrypt.genSalt(10)
                .then(function(salt) {
                    return Bcrypt.hash(password, salt);
                })
                .then(function(hash) {
                    return { password, hash };
                });
        },

        findByCredentials: function(email, password, Log) {

            const self = this;

            const query = {
                email: email.toLowerCase(),
            };

            let user = {};

            return self.findOne(query).lean()
                .then(function(result) {
                    user = result;

                    if (!user) {
                        return false;
                    }

                    const source = user.password;

                    return Bcrypt.compare(password, source);
                })
                .then(function(passwordMatch) {
                    if (passwordMatch) {
                        return user;
                    }
                });
        },

        setOtp: function(key, value, Log){
            const otp = Math.floor(Math.random()*90000) + 10000;
            const otpExp = Date.now() + (30 * 60 * 1000);
            const query = {
                [key]: value
            };
            const update = {
                $set : {
                    'twofactor.standard': { 
                        otp: otp, 
                        otpExp: otpExp
                    }
                }
            };
            return this.update(query, update).then((result)=>{
                result.otp = otp;
                result.otpExp = otpExp;
                return result;
            });
        },

        unSetOtp: function(key, value, Log){
            const otp = "";
            const otpExp = "";
            const query = {
                [key]: value
            };
            const update = {
                $set : {
                    'twofactor.standard': { 
                        otp: otp, 
                        otpExp: otpExp
                    }
                }
            };
            return this.update(query, update).then((result)=>{
                result.otp = otp;
                result.otpExp = otpExp;
                return result;
            });
        },

        findByGivenKey: function(key, value, password, Log){
            const query = {
                [key]: value
            }
            let user = {};
            return this.findOne(query).lean().then((result) => {
                    user = result;
                    //EXPL: Local strategy should be set for user to login in
                    if (!user) {
                        return false;
                    }
                    if(!user.identities || !user.identities.local) {
                        return "NO_LOCAL_STRATEGY";
                    }
                    const source = user.password;
                    return Bcrypt.compare(password, source);
                })
                .then((passwordMatch) => {
                    if (passwordMatch === "NO_LOCAL_STRATEGY") {
                        return "NO_LOCAL_STRATEGY";
                    }
                    if (passwordMatch) {
                        return user;
                    }
                });
        }
    };

    return Schema;
};