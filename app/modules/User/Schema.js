let mongoose = require('mongoose');
const Config = require("../../../configs/configs");
let schema = mongoose.Schema;
const _ = require("lodash");
const beautifyUnique = require('mongoose-beautiful-unique-validation');
let roleSchema = require('../Roles/Schema').roleSchema;

let user = new schema({
    fullName: { type: String },
    emailId: {
        type: String, default: null,
        index: {
            unique: true,
            partialFilterExpression: { emailId: { $type: 'string' } },
        },
        unique: 'Two users cannot share the same email ({VALUE})'
    },
    timezone: { type: String },
    status: { type: Boolean, default: true },
    photo: {
        type: String,
        // get: function (photo) {
        //     return Config.apiUrl + photo
        // }
    },
    role: [roleSchema],
    bio: {type: String, required: [false, 'Please a bio']},

    fbId: { type: String },
    googleId: { type: String },
    appleId: { type: String },

    dob: { type: Date },
    countryCode: { type: String },
    mobile: {
        type: String, default: null,
        index: {
            unique: true,
            partialFilterExpression: { mobile: { $type: 'string' } },
        },
        unique: 'Two users cannot share the same mobile number ({VALUE})'
    },

    password: { type: Buffer },
    emailVerificationStatus: { type: Boolean, default: false },

    verificationToken: { type: String },
    verificationTokenCreationTime: { type: Date },
    forgotToken: { type: String },
    forgotTokenCreationTime: { type: Date },
    deviceToken: { type: String },
    device: { type: String },

    address: { type: String, trim: true },

   
    isVerifyByAdmin: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    previouslyUsedPasswords: [{ type: Buffer }],
    passwordUpdatedAt: { type: Date },
    lastSeen: { type: Date },
    
    failedAttempts: [{ ip: { type: String }, attempts: { type: Number }, blockedDate: { type: Date }, isBlocked: { type: Boolean, default: false } }],
}, {
    timestamps: true
});
// function url(photo)
// {
//     console.log(photo,'phot')
//     return Config.apiUrl + photo
// }


user.plugin(beautifyUnique);
let Users = mongoose.model('Users', user);

module.exports = {
    Users,
    user
}