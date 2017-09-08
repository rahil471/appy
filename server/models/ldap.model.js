'use strict';

const Config = require('../../config');

module.exports = function(mongoose) {
    var modelName = "ldap";
    var collectionNameSwagger = "connection/ldap";
    var Types = mongoose.Schema.Types;
    var Schema = new mongoose.Schema({
        connectionName: {
            type: Types.String,
            required: true,
            unique: true,
            index: true
        },
        url: {
            type: Types.String,
            required: true
        },
        bindDN: {
            type: Types.String,
            required: true
        },
        bindCredentials: {
            type: Types.String,
            required: true
        },
        searchBase: {
            type: Types.String,
            required: true
        },
        searchAttributes: [{
            type: Types.String
        }],
        kerberos: {
            type: Types.Boolean,
            required: true,
            default: false
        },
        profileMapping: {
            type: Types.Object,
            username: {
                type: Types.String,
                default: ["uid", "cn"],
                allowOnCreate: false,
                allowOnUpdate: false
            },
            firstName: {
                type: Types.String,
                default: ["cn", "uid"]             
            },
            lastName: {
                type: Types.String,
                default: "sn"              
            },
            emails: {
                type: Types.String,
                default: "mail" 
            },
            groups: {
                type: Types.String,
                required: true,
                default: "groups"
            },
            dn: {
                type: Types.String,
                default: "dn"
            },
            postalCode: {
                type: Types.String,
                default: "postalCode"
            }
        }
    }, { collection: modelName });

    Schema.statics = {
        collectionName: modelName,
        routeOptions: {
            associations: {},
            create: {
                pre: function(payload, request, Log) {
    
                    payload.profileMapping = payload.profileMapping || {};
                    payload.profileMapping.username = ["uid", "cn"];
                    payload.profileMapping.firstName = payload.profileMapping.firstName || ["cn", "uid"];
                    payload.profileMapping.lastName = payload.profileMapping.lastName || "sn";
                    payload.profileMapping.email = payload.profileMapping.email || "mail";
                    payload.profileMapping.ldapGroups = payload.profileMapping.groups || "groups";
                    payload.profileMapping.dn = payload.profileMapping.dn || "dn";
                    payload.profileMapping.postalCode = payload.profileMapping.postalCode || "postalCode";
                    return payload;
                }
            }
        }
    };

    return Schema;
};