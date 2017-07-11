'use strict';

const _ = require('lodash');
const Config = require('../../config');

module.exports = function(mongoose) {
    var modelName = "social";
    var collectionNameSwagger = "connection/social";
    var Types = mongoose.Schema.Types;
    var Schema = new mongoose.Schema({
        name: {
            type: Types.String,
            required: true,
            unique: true,
            enum: ["facebook", "twitter", "instagram", "linkedin", "github", "google", "amazon", "dropbox", "foursquare", "imgur", "meetup", "wordpress", "tumblr"]
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
        attributes: [{
            type: Types.String
        }],
        permissions: [{
            type: Types.String,
        }]
    }, { collection: modelName });

    Schema.statics = {
        collectionName: collectionNameSwagger,
        routeOptions: {
            associations: {}
        }
    };

    return Schema;
};