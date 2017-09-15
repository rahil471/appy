'use strict';

const _ = require('lodash');
const Config = require('../../config');
const Chalk = require('chalk');
const Boom = require('boom');
const Joi = require('joi');
const authStrategy = Config.get('/restHapiConfig/authStrategy');
const defaultPreference = Config.get('/preferences');

module.exports = function(mongoose) {
    var modelName = "preferences";
    var Types = mongoose.Schema.Types;
    var Schema = new mongoose.Schema({
        user: {
            type: Types.ObjectId,
            ref: "user",
            unique: true
        },
        preferences: {
            type: Types.Mixed,
            required: true
        }
    }, { collection: modelName });

    Schema.statics = {
        collectionName: modelName,
        routeOptions: {
            associations: {
                user: {
                    type: "ONE_ONE",
                    model: "user"
                }
            },
            create: {
                post: function(payload, request, Log) {
                    let query = {
                        _id: mongoose.Types.ObjectId(payload.user)
                    }
                    let update = {
                        preferences: payload._id
                    }
                    return mongoose.model('user').update(query, update)
                        .then(_ => payload)
                        .catch(error => {
                            Log.error(error);
                            throw 'Error while connecting user to preferences!';
                        });
                }
            },
            delete: {
                pre: function(payload, request, Log) {
                    throw 'delete request is not allowed!';
                }
            },
            extraEndpoints: [
                function(server, model, options, Log) {
                    Log = Log.bind(Chalk.magenta("User profile Preferences"));

                    const HeadersValidation = Joi.object({
                        'authorization': Joi.string().required()
                    }).options({ allowUnknown: true });

                    const preferenceProfileHandler = function(request, reply) {
                        if (request.auth.credentials.user.preferences) {
                            mongoose.model('preferences').findOne({ _id: request.auth.credentials.user.preferences })
                                .then(result => reply(result))
                                .catch(error => {
                                    return reply(Boom.internal('Error while access database.'));
                                });
                        } else {
                            return reply({
                                "_id": null,
                                "user": request.auth.credentials.user._id,
                                "preferences": defaultPreference,
                                "isDeleted": false
                            })
                        }
                    };

                    server.route({
                        method: 'GET',
                        path: '/preferences/profilepreferences',
                        config: {
                            handler: preferenceProfileHandler,
                            auth: authStrategy,
                            description: 'User profile preferences.',
                            tags: ['api', 'Profile', 'profile preferences'],
                            validate: {
                                headers: HeadersValidation
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
                function(server, model, options, Log) {
                    Log = Log.bind(Chalk.magenta("User profile Preferences "));

                    const HeadersValidation = Joi.object({
                        'authorization': Joi.string().required()
                    }).options({ allowUnknown: true });

                    //check if preference is present in db then update else create new one
                    function checkAndUpdatePreference(preferenceId, user, preferences) {

                        return new Promise((resolve, reject) => {
                            let query = { _id: mongoose.Types.ObjectId(preferenceId) };
                            mongoose.model('preferences').findOne(query)
                                .then(result => {
                                    if (result) {
                                        result.preferences = preferences
                                        return result.save()
                                    } else {
                                        let create = {};
                                        create.preferences = preferences;
                                        create.user = user;
                                        return mongoose.model('preferences').create(create)
                                    }
                                })
                                .then(result => {
                                    resolve(result)
                                })
                                .catch(error => reject(error))
                        });
                    }

                    const preferenceProfileSaveHandler = function(request, reply) {

                        mongoose.model('user').findOne({ _id: request.auth.credentials.user._id }, "preferences")
                            .then(result => result.preferences || null)
                            .then(preferencesId => {
                                if (preferencesId) {
                                    return checkAndUpdatePreference(preferencesId, request.auth.credentials.user._id, request.payload.preferences)
                                } else {
                                    let create = {};
                                    create.preferences = request.payload.preferences;
                                    create.user = request.auth.credentials.user._id;
                                    return mongoose.model('preferences').create(create)
                                }
                            })
                            .then(result => {
                                if (result._id) {
                                    let query = { _id: mongoose.Types.ObjectId(request.auth.credentials.user._id) };
                                    let update = { preferences: result._id }
                                    return mongoose.model('user').update(query, { $set: update })
                                } else {
                                    return result;
                                }
                            })
                            .then(result => {
                                return reply({ message: "success", error: 0 })
                            })
                            .catch(error => {
                                Log.error(error);
                                return reply(Boom.internal("Error while saving the preferences!"));
                            })
                    };

                    server.route({
                        method: 'PUT',
                        path: '/preferences/save',
                        config: {
                            handler: preferenceProfileSaveHandler,
                            auth: authStrategy,
                            description: 'Save User profile preferences.',
                            tags: ['api', 'Profile', 'profile preferences'],
                            validate: {
                                headers: HeadersValidation,
                                payload: {
                                    preferences: Joi.object().required()
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
                }
            ]
        }
    };

    return Schema;
};