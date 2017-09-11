'use strict';

const _ = require('lodash');
const Config = require('../../config');

module.exports = function(mongoose) {
    var modelName = "email-template";
    var collectionNameSwagger = "email/template";
    var Types = mongoose.Schema.Types;
    var Schema = new mongoose.Schema({
        template: {
            type: Types.String,
            required: true,
            unique: true,
            enum: ["verify_email", "welcome_email", "enrollment_email", "reset_email", "blocked_account", "stolen_credentials"]
        },
        status: {
            type: Types.Boolean,
            required: true,
            default: false
        },
        from: {
            type: Types.String,
            required: true
        },
        subject: {
            type: Types.String,
            required: true,
        },
        redirect_to: {
            type: Types.String,
            required: true,
        },
        url_lifetime: {
            type: Types.String,
            required: true,
        },
        message: {
            type: Types.String,
            required: true
        }
    }, { collection: modelName });

    Schema.statics = {
        collectionName: modelName,
        routeOptions: {
            alias: "email/template",
            associations: {}
        }
    };

    return Schema;
};