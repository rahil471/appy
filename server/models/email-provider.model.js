'use strict';

const _ = require('lodash');
const Config = require('../../config');

module.exports = function(mongoose) {
    var modelName = "email-provider";
    var Types = mongoose.Schema.Types;
    var Schema = new mongoose.Schema({
        from: {
            type: Types.String,
            required: true
        },
        host: {
            type: Types.String,
            required: true,
        },
        port: {
            type: Types.Number,
            required: true,
        },
        username: {
            type: Types.String,
            required: true,
        },
        password: {
            type: Types.String,
            required: true
        }
    }, { collection: modelName });

    Schema.statics = {
        collectionName: modelName,
        scope: {
            deleteScope: "superadmin",
        },
        routeOptions: {
            alias: "email/provider",
            associations: {}
        }
    };

    return Schema;
};