const mongoose = require("mongoose");
const Types = mongoose.Schema.Types;
module.exports = {
    "user": {
        firstName: {
            type: Types.String,
            required: true
        },
        middleName: {
            type: Types.String,
            required: false
        },
        lastName: {
            type: Types.String,
            required: true
        },
        customData: {
            type: Types.Mixed,
            required: true
        },
    },
    "role": {

    },
    "permission": {

    },
    "group": {

    }
}