/****************************
 SECURITY TOKEN HANDLING
 ****************************/
const _ = require('lodash');
const Moment = require('moment');
const i18n = require("i18n");
let jwt = require('jsonwebtoken')

const config = require('./configs');
const Authentication = require('../app/modules/Authentication/Schema').Authtokens;
const Users = require('../app/modules/User/Schema').Users;
const Admin = require('../app/modules/Admin/Schema').Admin;
const RolesSchema = require('../app/modules/Roles/Schema').RolesSchema;
const Model = require('../app/modules/Base/Model');
const exportLib = require('../lib/Exports');

class Globals {

    // Generate Token
    getToken(params) {
        return new Promise(async (resolve, reject) => {
            try {
                // Generate Token
                let token = jwt.sign({
                    id: params.id,
                    algorithm: "HS256",
                    exp: Math.floor(Date.now() / 1000) + parseInt(config.tokenExpiry)
                }, config.securityToken);

                params.token = token;
                params.userId = params.id;
                params.tokenExpiryTime = Moment().add(parseInt(config.tokenExpirationTime), 'minutes');
                delete params.id
                await Authentication.findOneAndUpdate({ userId: params.userId }, params, { upsert: true, new: true });
                return resolve(token);
            } catch (err) {
                console.log("Get token", err);
                return reject({ message: err, status: 0 });
            }
        });
    }
    // Generate Token
    getTokenWithRefreshToken(params) {
        return new Promise(async (resolve, reject) => {
            try {
                // Generate Token
                let token = jwt.sign({
                    id: params.id,
                    algorithm: "HS256",
                    exp: Math.floor(Date.now() / 1000) + parseInt(config.tokenExpiry)
                }, config.securityToken);

                // Generate refreshToken
                let refreshToken = jwt.sign({
                    id: params.id,
                    algorithm: "HS256",
                    exp: Math.floor(Date.now() / 1000) + parseInt(config.tokenExpiry)
                }, config.securityRefreshToken);

                params.token = token;
                params.userId = params.id;
                params.refreshToken = refreshToken;
                params.tokenExpiryTime = Moment().add(parseInt(config.tokenExpirationTime), 'minutes');
                delete params.id;
                await Authentication.findOneAndUpdate({ userId: params.userId }, params, { upsert: true, new: true });
                return resolve({ token, refreshToken });
            } catch (err) {
                console.log("Get token", err);
                return reject({ message: err, status: 0 });
            }
        });
    }


    AdminToken(params) {
        return new Promise(async (resolve, reject) => {
            try {
                // Generate Token
                let token = jwt.sign({
                    id: params.id,
                    algorithm: "HS256",
                    exp: Math.floor(Date.now() / 1000) + parseInt(config.tokenExpiry)
                }, config.securityToken);

                params.token = token;
                params.adminId = params.id;
                params.tokenExpiryTime = Moment().add(parseInt(config.tokenExpirationTime), 'minutes');
                const d = await Authentication.findOne({ ipAddress: params.ipAddress, adminId: params.adminId });
                if (_.isEmpty(d)) {
                    await new Model(Authentication).store(params);
                } else {
                    await Authentication.findByIdAndUpdate(d._id, params, { new: true });
                }
                return resolve(token);
            } catch (err) {
                console.log("Get token", err);
                return reject({ message: err, status: 0 });
            }

        });
    }

    generateToken(id) {
        return new Promise(async (resolve, reject) => {
            try {
                let token = jwt.sign({
                    id: id,
                    algorithm: "HS256",
                    exp: Math.floor(Date.now() / 1000) + parseInt(config.tokenExpiry)
                }, config.securityToken);

                return resolve(token);
            } catch (err) {
                console.log("Get token", err);
                return reject({ message: err, status: 0 });
            }

        });
    }
    generateOtpToken() {
        // return Math.round((Math.pow(36, 6 + 1) - Math.random() * Math.pow(36, 6))).toString(36).slice(1);
        return Math.floor(100000 + Math.random() * 900000);
    }
    static async checkAuthorization(req, res, next) {
        try {
            const token = req.headers.authorization;
            const authenticate = new Globals();

            const tokenCheck = await authenticate.checkTokenInDB(token);
            if (!tokenCheck) return exportLib.Error.handleError(res, { status: true, code: 'UNAUTHORIZED', message: exportLib.ResponseEn.INVALID_TOKEN });
            //return res.status(401).json({ status: 0, message: i18n.__("INVALID_TOKEN") });

            const tokenExpire = await authenticate.checkExpiration(token);
            if (!tokenExpire) return exportLib.Error.handleError(res, { status: true, code: 'UNAUTHORIZED', message: exportLib.ResponseEn.TOKEN_EXPIRED });
            //return res.status(401).json({ status: 0, message: i18n.__("TOKEN_EXPIRED") });

            const userExist = await authenticate.checkUserInDB(token);
            if (!userExist) return exportLib.Error.handleError(res, { status: true, code: 'UNAUTHORIZED', message: exportLib.ResponseEn.USER_NOT_EXIST_OR_DELETED });
            // return res.status(401).json({ status: 0, message: i18n.__("USER_NOT_EXIST_OR_DELETED") });

            if (req.originalUrl) {
                let pathParams = req.originalUrl.split("/");
                if (!pathParams || (pathParams && Array.isArray(pathParams) && _.last(pathParams) && !_.isEqual(_.last(pathParams), 'changePassword'))) {
                    if (config.forceToUpdatePassword && config.forceToUpdatePassword == 'true') {
                        let shouldPasswordNeedToUpdate = await authenticate.checkPasswordExpiryTime({ userObj: userExist });
                        if (shouldPasswordNeedToUpdate) {
                            return exportLib.Error.handleError(res, { status: true, code: 'UNAUTHORIZED', message: exportLib.ResponseEn.FORCE_PASSWORD_CHANGE });
                            // return res.json({ status: 0, message: i18n.__("FORCE_PASSWORD_CHANGE") });
                        }
                    }
                }
            }
            if (userExist._id) {
                req.currentUser = userExist;
                if (config.extendTokenTime && config.extendTokenTime == 'true') {
                    await authenticate.extendTokenTime(userExist._id);
                }
            }

            next();
        } catch (error) {
            console.log("Token authentication", err);
            return exportLib.Error.handleError(res, { status: false, code: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    // Validating Token
    static async isAuthorised(req, res, next) {
        try {
            const token = req.headers.authorization;
            if (!token) return exportLib.Error.handleError(res, { status: true, code: 'UNAUTHORIZED', message: exportLib.ResponseEn.TOKEN_WITH_API });
            Globals.checkAuthorization(req, res, next);
        } catch (err) {
            console.log("Token authentication", err);
            return exportLib.Error.handleError(res, { status: false, code: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    // Validating Token
    static async isAuthorisedOptional(req, res, next) {
        try {
            const token = req.headers.authorization;
            if (token) {
                Globals.checkAuthorization(req, res, next);
            } else {
                next();
            }
        } catch (err) {
            console.log("Token authentication", err);
            return exportLib.Error.handleError(res, { status: false, code: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
    }
    static async isValid(req, res, next) {
        try {
            if (config.useRefreshToken && config.useRefreshToken != 'true') {
                return res.status(401).json({ status: 0, message: 'Not authorized to refresh token.' });
            }
            next();
        } catch (err) {
            console.log("isValid", err);
            return res.send({ status: 0, message: err });
        }
    }
    async extendTokenTime(userId) {
        return new Promise(async (resolve, reject) => {
            try {
                const authenticate = await Authentication.findOne({ userId: userId });
                if (authenticate && authenticate.tokenExpiryTime) {
                    let expiryDate = Moment(authenticate.tokenExpiryTime).subtract(2, 'minutes')
                    let now = Moment();
                    if (now > expiryDate) {
                        await Authentication.findOneAndUpdate({ userId: userId }, { tokenExpiryTime: Moment(authenticate.tokenExpiryTime).add(parseInt(config.tokenExpirationTime), 'minutes') });
                    }
                }
                return resolve();
            } catch (error) {
                reject(error);
            }
        });
    }
    async checkPasswordExpiryTime(data) {
        return new Promise(async (resolve, reject) => {
            try {
                if (data && data.userObj && data.userObj.passwordUpdatedAt) {
                    let lastChangedDate = Moment(data.userObj.passwordUpdatedAt, 'YYYY-MM-DD HH:mm:ss');
                    let currentDate = Moment(new Date(), 'YYYY-MM-DD HH:mm:ss');
                    let duration = Moment.duration(currentDate.diff(lastChangedDate));
                    let months = duration.asMonths();
                    if (months >= parseInt(config.updatePasswordPeriod)) {
                        return resolve(true);
                    }
                    return resolve(false);
                }
                return resolve()
            } catch (error) {
                return reject(error);
            }
        });
    }

    static isAdminAuthorised(resource) {
        return async (req, res, next) => {
            try {
                const token = req.headers.authorization;
                if (!token) return res.status(401).json({ status: 0, message: i18n.__("TOKEN_WITH_API") });

                const authenticate = new Globals();

                const tokenCheck = await authenticate.checkTokenInDB(token);
                if (!tokenCheck) return res.status(401).json({ status: 0, message: i18n.__("INVALID_TOKEN") });

                const tokenExpire = await authenticate.checkExpiration(token);
                if (!tokenExpire) return res.status(401).json({ status: 0, message: i18n.__("TOKEN_EXPIRED") });

                const userExist = await authenticate.checkAdminInDB(token);
                if (!userExist) return res.status(401).json({ status: 0, message: i18n.__("ADMIN_NOT_EXIST") });

                if (userExist._id) {
                    req.currentUser = userExist;
                    // Check admin is authorized to access API
                    if (resource && resource.length && userExist.role && userExist.role._id) {
                        let role = await RolesSchema.findOne({ _id: userExist.role._id }).populate('permissions', { permissionKey: 1 });
                        if (role && role.permissions) {
                            let permissions = _.map(role.permissions, 'permissionKey');
                            if (_.difference(resource, permissions).length != 0) {
                                return res.status(401).json({ status: 0, message: i18n.__("UNAUTHORIZED_TO_ACCESS") });
                            }
                        } else {
                            return res.status(401).json({ status: 0, message: i18n.__("UNAUTHORIZED_TO_ACCESS") });
                        }
                    }
                }
                next();
            } catch (err) {
                console.log("Token authentication", err);
                return res.send({ status: 0, message: err });
            }
        }

    }
    // Check User Existence in DB
    checkUserInDB(token) {
        return new Promise(async (resolve, reject) => {
            try {
                // Initialisation of variables
                let decoded = jwt.decode(token);
                if (!decoded) { return resolve(false); }
                let userId = decoded.id

                const user = await Users.findOne({ _id: userId, isDeleted: false });
                if (user) return resolve(user);
                return resolve(false);

            } catch (err) {
                console.log("Check user in db")
                return reject({ message: err, status: 0 });
            }

        })
    }
    //Check admin in db
    checkAdminInDB(token) {
        return new Promise(async (resolve, reject) => {
            try {
                // Initialisation of variables
                let decoded = jwt.decode(token);
                if (!decoded) { return resolve(false); }
                let adminId = decoded.id
                const user = await Admin.findOne({ _id: adminId, isDeleted: false });
                if (user) { return resolve(user); }
                return resolve(false);
            } catch (err) {
                console.log("Check ADMIN in db")
                return reject({ message: err, status: 0 });
            }
        })
    }
    // Check token in DB
    checkTokenInDB(token) {
        return new Promise(async (resolve, reject) => {
            try {
                let tokenDetails = Buffer.from(token, 'binary').toString();
                // Initialisation of variables
                let decoded = jwt.verify(tokenDetails, config.securityToken, { ignoreExpiration: true });
                if (!decoded) { return resolve(false); }

                const authenticate = await Authentication.findOne({ token: tokenDetails });
                if (authenticate) return resolve(true);
                return resolve(false);
            } catch (err) {
                console.log("Check token in db", err)
                return resolve({ message: err, status: 0 });
            }
        })
    }
    // Check Token Expiration
    checkExpiration(token) {
        return new Promise(async (resolve, reject) => {
            let tokenDetails = Buffer.from(token, 'binary').toString();
            let status = false;
            const authenticate = await Authentication.findOne({ token: tokenDetails });
            if (authenticate && authenticate.tokenExpiryTime) {
                let expiryDate = Moment(authenticate.tokenExpiryTime, 'YYYY-MM-DD HH:mm:ss')
                let now = Moment(new Date(), 'YYYY-MM-DD HH:mm:ss');
                if (expiryDate > now) { status = true; resolve(status); }
            }
            resolve(status);
        })
    }
    refreshAccessToken(refreshtoken) {
        return new Promise(async (resolve, reject) => {
            // Initialisation of variables
            let decoded = jwt.decode(refreshtoken);
            if (!decoded) { return resolve({ status: 0, message: "Invalid refresh token." }); }
            let userId = decoded.id
            const authenticationData = await Authentication.findOne({ userId: userId });
            if (authenticationData && authenticationData.tokenExpiryTime) {
                let expiryDate = Moment(authenticationData.tokenExpiryTime, 'YYYY-MM-DD HH:mm:ss')
                let now = Moment(new Date(), 'YYYY-MM-DD HH:mm:ss');
                if (expiryDate > now) {
                    return resolve({ status: 0, message: "Access token is not expired yet." });
                } else {
                    const authenticate = new Globals();
                    const { token, refreshToken } = await authenticate.getTokenWithRefreshToken({ id: authenticationData.userId });
                    return resolve({ status: 1, message: "Token refreshed.", access_token: token, refreshToken: refreshToken });
                }
            }

            else {
                return resolve({ status: 0, message: "Wrong refresh token." });
            }
        });
    }
    static decodeAdminForgotToken(token) {
        return new Promise(async (resolve, reject) => {
            const admin = await Admin.findOne({ forgotToken: token });
            if (admin && admin.forgotTokenCreationTime && parseInt(config.forgotTokenExpireTime)) {
                let expiryDate = Moment(admin.forgotTokenCreationTime).add(parseInt(config.forgotTokenExpireTime), 'minutes');
                let now = Moment();
                if (expiryDate < now) {
                    return resolve(false);
                }
            }
            return resolve(true);
        });
    }
    static decodeUserForgotToken(token) {
        return new Promise(async (resolve, reject) => {
            const user = await Users.findOne({ forgotToken: token });
            if (user && user.forgotTokenCreationTime && parseInt(config.forgotTokenExpireTime)) {
                let expiryDate = Moment(user.forgotTokenCreationTime).add(parseInt(config.forgotTokenExpireTime), 'minutes');
                let now = Moment();
                if (expiryDate < now) {
                    return resolve(false);
                }
            }
            return resolve(true);
        });
    }

    static decodeUserVerificationToken(token) {
        return new Promise(async (resolve, reject) => {
            const user = await Users.findOne({ verificationToken: token });
            if (user && user.verificationTokenCreationTime && parseInt(config.verificationTokenExpireTime)) {
                let expiryDate = Moment(user.verificationTokenCreationTime).add(parseInt(config.verificationTokenExpireTime), 'minutes');
                let now = Moment();
                if (expiryDate < now) {
                    return resolve(false);
                }
            }
            return resolve(true);
        });
    }

    static decodeAdminVerificationToken(token) {
        return new Promise(async (resolve, reject) => {
            const user = await Admin.findOne({ verificationToken: token });
            if (user && user.verificationTokenCreationTime && parseInt(config.verificationTokenExpireTime)) {
                let expiryDate = Moment(user.verificationTokenCreationTime).add(parseInt(config.verificationTokenExpireTime), 'minutes');
                let now = Moment();
                if (expiryDate < now) {
                    return resolve(false);
                }
            }
            return resolve(true);
        });
    }

    // Generate OTP
    generateOTP() {
        return new Promise(async (resolve, reject) => {
            try {
                let date = new Date();
                let otpObject = {};
                let otpData = Math.floor(100000 + Math.random() * 900000); // 6 digit OTP
                // console.log(Math.floor(1000 + Math.random() * 9000)); // 4 digit OTP
                otpObject.otp = String(otpData);
                otpObject.otpExpireOn = date.getTime() + 10 * 60000;
                return resolve(otpObject);
            } catch (err) {
                console.log("generateOTP", err);
                return reject({ status: 0, message: err });
            }
        });
    }

    // Setting response language middleware
    static async setLocalLanguage(req, res, next) {
        try {
            if (!_.isEmpty(req.headers.language)) {
                i18n.setLocale(req.headers.language);
            } else {
                i18n.setLocale('en');
            }
            next();
        } catch (err) {
            console.log("setLocalLanguage", err);
            return res.send({ status: 0, message: err });
        }
    }

}

module.exports = Globals;
