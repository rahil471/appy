'use strict';

const _ = require('lodash');
const Config = require('../../config');

module.exports = function(mongoose) {
    var modelName = "application-settings";
    var Types = mongoose.Schema.Types;
    var Schema = new mongoose.Schema({
        // server: {
        login_with: {
            type: Types.String,
            required: true,
            unique: true,
            enum: ["email", "phone_number", "username"],
            default: "email"
        },
        twofactor_flag: {
            type: Types.Boolean,
            default: false
        },
        anyonecan_signup: {
            type: Types.Boolean,
            default: true
        },
        password_less: {
            type: Types.Boolean,
            default: false
        },
        password_complexity: {
            type: Types.String,
            enum: ["easy", "medium", "hard"],
            default: "medium"
        }
        // }
    }, { collection: modelName });

    Schema.statics = {
        collectionName: modelName,
        routeOptions: {
            alias: "application/settings",
            associations: {}
        }
    };

    return Schema;
};