let mongoose = require('mongoose');
let schema = mongoose.Schema;
const _ = require("lodash");

let roleSchema = require('../Roles/Schema').roleSchema;

let admin = new schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: { type: String },
    emailId: { type: String, required: true, unique: true },
    password: { type: Buffer },
    photo: { type: String, required: false },
    emailVerificationStatus: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
    mobile: { type: String },
    verificationToken: { type: String },
    verificationTokenCreationTime: { type: Date },
    forgotToken: { type: String },
    forgotTokenCreationTime: { type: Date },
    deviceToken: { type: String },
    device: { type: String },
    addedBy: { type: schema.Types.ObjectId, ref: 'Admin' },
    role: roleSchema,

    lastSeen: { type: Date },
    otp: { type: String },
    otpExpireOn: { type: Date },
    otpType: { type: String, enum: ['NewAdmin', 'Login', 'ForgotPassword', 'ChangeMobile'] },
    otpVerificationStatus: { type: Boolean, default: false },
    superAdminVerificationStatus: { type: Boolean, default: true },

    dob: { type: Date },
    gender: { type: String },

}, {
    timestamps: true
});

let models = mongoose.modelNames();
let Admin = !_.includes(models, 'Admin') ? mongoose.model('Admin', admin) : mongoose.models['Admin'];
module.exports = {
    Admin,
    admin
}