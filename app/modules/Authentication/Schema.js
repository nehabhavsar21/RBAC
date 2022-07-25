/**************************
 AUTHENTICATION SCHEMA INITIALISATION
 **************************/
let Schema = require('mongoose').Schema;
let mongoose = require('mongoose');

let authtokensSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'Users' },
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin' },
    token: { type: Buffer },
    refreshToken: { type: Buffer },
    deviceId: { type: String },
    role: { type: String },
    ipAddress: { type: String },
    tokenExpiryTime: { type: Date }
},
    { timestamps: true });

let Authtokens = mongoose.model('authtokens', authtokensSchema);

module.exports = {
    Authtokens: Authtokens,
}

