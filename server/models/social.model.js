'use strict';

const _ = require('lodash');
const Config = require('../../config');

module.exports = function(mongoose) {
    var modelName = "social";
    var Types = mongoose.Schema.Types;
    var Schema = new mongoose.Schema({
        name: {
            type: Types.String,
            required: true,
            unique: true,
            enum: ["facebook", "twitter", "instagram", "linkedin", "github", "google"]
        },
        clientid: {
            type: Types.String,
            required: true,
            unique: true
        },
        clientsecret: {
            type: Types.String,
            required: true,
            unique: true
        },
        scope: [{
            type: Types.String,
        }],
        successUrl: {
            type: Types.String,
            required: true
        },
        errorUrl: {
            type: Types.String,
            required: true
        },
        status: {
            type: Types.String,
            enum: ['active', 'inactive'],
            default: 'active'
        }
    }, { collection: modelName });

    Schema.statics = {
        collectionName: modelName,
        routeOptions: {
            alias: "connection/social",
            associations: {}
        }
    };

    return Schema;
};