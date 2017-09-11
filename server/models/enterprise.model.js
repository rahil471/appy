'use strict';

const _ = require('lodash');
const Config = require('../../config');

module.exports = function(mongoose) {
    var modelName = "enterprise";
    var Types = mongoose.Schema.Types;
    var Schema = new mongoose.Schema({
        url: {
            type: Types.String,
            required: true,
            unique: true
        },
        bindDN: {
            type: Types.String,
            required: true,
            unique: true
        },
        bindCredentials: {
            type: Types.String,
            required: true,
            unique: true
        },
        searchBase: {
            type: Types.String,
            required: true,
            unique: true
        },
        searchFilter: {
            type: Types.String,
            required: true,
            unique: true
        },
        searchAttributes: [{
            type: Types.String
        }]
    }, { collection: modelName });

    Schema.statics = {
        collectionName: modelName,
        routeOptions: {
            alias: "connection/enterprise",
            associations: {}
        }
    };

    return Schema;
};