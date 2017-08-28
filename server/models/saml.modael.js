'use strict';

const _ = require('lodash');
const Config = require('../../config');

module.exports = function(mongoose) {
    var modelName = "saml";
    var collectionNameSwagger = "saml";
    var Types = mongoose.Schema.Types;
    var Schema = new mongoose.Schema({
        provider: {
            type: Types.String,
            required: true,
            unique: true
        },
        metadata_secrete: {
            type: Types.String,
            require: true
        },
        sso_login_url: {
            type: Types.String,
            require: true
        },
        sso_logout_url: {
            type: Types.String,
            require: true
        },
        certificates: {
            type: Types.String,
            require: true
        },
        private_key: {
            type: Types.String,
            require: true
        },
        force_authn: {
            type: Types.Boolean,
            default: false
        },
        auth_context: {
            type: Types.String
        },
        nameid_format: {
            type: Types.String
        },
        successUrl: {
            type: Types.String,
            require: true
        },
        errorUrl: {
            type: Types.String,
            require: true
        },
        sso_response_mapping: {
            type: Types.Object,
            email: {
                type: Types.String,
                require: true
            },
            id: {
                type: Types.String,
                require: true
            },
            firstName: {
                type: Types.String,
                require: true
            },
            lastName: {
                type: Types.String,
                require: true
            }
        }
    }, { collection: modelName });

    Schema.statics = {
        collectionName: collectionNameSwagger,
        routeOptions: {
            associations: {},
        }
    };

    return Schema;
};