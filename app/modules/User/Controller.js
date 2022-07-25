
const _ = require("lodash");
const i18n = require("i18n");
const Transaction = require('mongoose-transactions');
var mongoose = require('mongoose');

const Controller = require("../Base/Controller");
const Users = require('./Schema').Users;
const UserSchema = require('./Schema').user;
const Email = require('../../services/Email');
const Model = require("../Base/Model");
const userProjection = require('../User/Projection.json')
const Globals = require("../../../configs/Globals");
const Config = require("../../../configs/configs");
const RequestBody = require("../../services/RequestBody");
const Authentication = require('../Authentication/Schema').Authtokens;
const RolesSchema = require('../Roles/Schema').RolesSchema;
const RoleService = require("../Roles/Service");
const CommonService = require("../../services/Common");
const File = require("../../services/File");
const exportLib = require('../../../lib/Exports');
const { config } = require("custom-env");

const { ObjectID } = require("bson");
const Moment = require('moment-timezone');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const getClientSecret = () => {

    const time = new Date().getTime() / 1000; // Current time in seconds since Epoch
    const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_FILE);

    const headers = {
        kid: process.env.KEY_ID,
        typ: undefined
    }

    const claims = {
        'iss': process.env.TEAM_ID,
        'iat': time, // The time the token was generated
        'exp': time + 86400 * 180, // Token expiration date
        'aud': process.env.APPLE_URL,
        'sub': process.env.SERVICE_ID,
    }

    token = jwt.sign(claims, privateKey, {
        algorithm: 'ES256',
        header: headers
    });

    return token
}

class UsersController extends Controller {
    constructor() {
        super();
    }

    /********************************************************
   Purpose: user register
   Parameter:
      {
          "emailId":"john@doe.com",
          "password":"john",
          "mobile":"987654321",
          "firstName":"john",
          "lastName":"deo",
          "bio":"something about you"
      }
   Return: JSON String
   ********************************************************/
    async customerRegister() {
        try {
            let existingUserId = "";
            let form = new Form(this.req);
            let formObject = await form.parse();
            const file = new File(formObject.files);
            let filePath = "";
            if (formObject.files && formObject.files.file && formObject.files.file[0] && Config.s3upload && Config.s3upload == 'true') {
                filePath = file.uploadFileOnS3(formObject.files.file[0]);
            }
            else {
                if (!_.isEmpty(formObject.files)) {
                    filePath = await file.store();
                }
                /***** uncommit this line to do manipulations in image like compression and resizing ****/
                // let fileObject = await file.saveImage();
                //filePath = fileObject.filePath;
            }



            // check emailId is exist or not
            let data = formObject.fields;
            let filter = { "emailId": data.emailId && data.emailId[0] ? data.emailId[0] : "" }
            const checkEmailId = await Users.findOne(filter);

            //if user exist give error
            if (!_.isEmpty(checkEmailId) && checkEmailId.emailId) {
                return exportLib.Error.handleError(this.res, { status: 0, code: 'CONFLICT', message: exportLib.ResponseEn.DUPLICATE_EMAIL_OR_USERNAME });
            }

            let isPasswordValid = await (new CommonService()).validatePassword({ password: data.password[0] });
            if (isPasswordValid && !isPasswordValid.status) {
                return this.res.send(isPasswordValid)
            }
            let password = await (new CommonService()).ecryptPassword({ password: data.password[0] });

            let role = await RolesSchema.findById(data.roleId);
            if(!role){
                return exportLib.Error.handleError(this.res, { status: 0, code: 'NOT_FOUND', message: exportLib.ResponseEn.ROLE_NOT_FOUND });
            }
            let insertData = { password: password, role: { _id: role._id, role: role.role } };
            insertData['emailId'] = data && data.emailId && data.emailId[0];
            insertData['fullName'] = data && data.fullName && data.fullName[0];
        
            // save new user
            let newUserId = await new Model(Users).store(insertData);
            


            // if empty not save user details and give error message.
            if (_.isEmpty(newUserId)) {
                return exportLib.Error.handleError(this.res, { status: 0, code: 'CONFLICT', message: exportLib.ResponseEn.USER_NOT_SAVED });
            }
            else {
                const token = await new Globals().generateToken(newUserId);
                //sending mail to verify user
                let emailData = {
                    emailId: data.emailId[0],
                    emailKey: 'signup_mail',
                    replaceDataObj: { emailId: data.emailId[0], verificationLink: Config.rootUrl + '/users/verifyUser?token=' + token }
                };
                await new Email().sendMail(emailData);
                await Users.findByIdAndUpdate(newUserId, { verificationToken: token, verificationTokenCreationTime: new Date() });
                return exportLib.Response.handleMessageResponse(this.res, { status: 1, code: 'OK', message: exportLib.ResponseEn.REGISTRATION_SCUCCESS });
            }
            // }
        } catch (error) {
            console.log("error = ", error);
            // transaction.rollback();
            //this.res.send({ status: 0, message: error });
            return exportLib.Error.handleError(this.res, { status: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }

    }
    /********************************************************
    Purpose: Forgot password mail
    Parameter:
        {
            "emailId":"john@doe.com"
        }
    Return: JSON String
   ********************************************************/
    async forgotPasswordMail() {
        try {
            let emailId = this.req.body.emailId;
            let user = await Users.findOne({ emailId: emailId });
            if (_.isEmpty(user)) {
                return exportLib.Error.handleError(this.res, { status: 0, code: 'CONFLICT', message: exportLib.ResponseEn.REGISTERED_EMAIL });
            }
            let globalObj = new Globals();
            const token = await globalObj.generateOtpToken(user._id);
            await Users.findByIdAndUpdate(user._id, { forgotToken: token, forgotTokenCreationTime: new Date() });

            let emailData = {
                emailId: emailId,
                emailKey: 'forgot_password_mail',
                replaceDataObj: { fullName: user.fullName, token: token }
            };

            const sendingMail = await new Email().sendMail(emailData);
            if (sendingMail && sendingMail.status == 0) {
                return exportLib.Error.handleError(this.res, { status: 0, code: 'CONFLICT', message: sendingMail });
            }
            if (sendingMail && !sendingMail.response) {
                return exportLib.Error.handleError(this.res, { status: 0, code: 'CONFLICT', message: exportLib.ResponseEn.SERVER_ERROR });
            }
            return exportLib.Response.handleMessageResponse(this.res, { status: 1, code: 'OK', message: exportLib.ResponseEn.CHECK_EMAIL });

        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }
    /********************************************************
    Purpose: Reset password
    Parameter:
        {
            "email": "email@example.com"
            "password":"123456",
            "token": "xX74Yh"
        }
    Return: JSON String
   ********************************************************/
    async resetPassword() {
        try {
            let user = await Users.findOne({ forgotToken: this.req.body.token, emailId: this.req.body.email });
            if (_.isEmpty(user)) {
                return this.res.send({ status: 0, message: i18n.__("INVALID_OTP") });
            }
            // Check if the the token creation time > 10 mins of now
            let recentTime = Moment(new Date(), 'YYYY-MM-DD HH:mm:ss');
            let difference = Moment.duration(recentTime.diff(user.forgotTokenCreationTime));
            let mins = difference.asMinutes();
            if (mins > 10) {
                return this.res.send({ status: 0, message: i18n.__("TOKEN_EXPIRED") });
            }

            let isPasswordValid = await (new CommonService()).validatePassword({ password: this.req.body.password });
            if (isPasswordValid && !isPasswordValid.status) {
                return this.res.send(isPasswordValid);
            }
            let password = await (new CommonService()).ecryptPassword({ password: this.req.body.password });

            const updateUser = await Users.findByIdAndUpdate(user._id, { password: password, forgotToken: "", forgotTokenCreationTime: "" }, { new: true });
            if (_.isEmpty(updateUser)) {
                return this.res.send({ status: 0, message: i18n.__("PASSWORD_NOT_UPDATED") });
            }
            return this.res.send({ status: 1, message: i18n.__("PASSWORD_UPDATED_SUCCESSFULLY") });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }
    /********************************************************
    Purpose: Login
    Parameter:
        {
            "emailId":"john@doe.com"
            "password":"123456",
            "deviceToken": "errrrwqqqsssfdfvfgfdewwwww",
            "device": "ios"
        }
    Return: JSON String
   ********************************************************/
    async login() {
        try {
            let fieldsArray = ["emailOrMobile", "password"];
            let emptyFields = await (new RequestBody()).checkEmptyWithFields(this.req.body, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return exportLib.Error.handleError(this.res, { status: 0, code: 'UNPROCESSABLE_ENTITY', message: exportLib.ResponseEn.SEND_PROPER_DATA + emptyFields + " fields required." });
            }

            let data = await (new RequestBody()).processRequestBody(this.req.body, ["deviceToken", "device", "timezone"]);
            const user = await Users.findOne({ $or: [{ emailId: this.req.body.emailOrMobile }, { mobile: this.req.body.emailOrMobile }] });

            if (_.isEmpty(user)) {
                return exportLib.Error.handleError(this.res, { status: 0, code: 'UNPROCESSABLE_ENTITY', message: exportLib.ResponseEn.USER_NOT_EXIST_OR_DELETED });
            }
            else if (!user.emailVerificationStatus) {
                return exportLib.Error.handleError(this.res, { status: 0, code: 'UNPROCESSABLE_ENTITY', message: exportLib.ResponseEn.VERIFY_EMAIL });
            }
            else if (!user.password) {
                return exportLib.Error.handleError(this.res, { status: 0, code: 'UNPROCESSABLE_ENTITY', message: exportLib.ResponseEn.SET_PASSWORD });
            }

            // if (Config.isBlockAfterFailedAttempt && Config.isBlockAfterFailedAttempt == 'true') {
            //     let result = await (new CommonService()).handleWrongPasswordAttempt({ user: user, ip: this.req.ip, password: this.req.body.password });
            //     if (result && result.status == 0) {
            //         return this.res.send(result);
            //     }
            // } else {
            //     const status = await (new CommonService()).verifyPassword({ password: this.req.body.password, savedPassword: user.password });
            //     if (!status) {
            //         return this.res.send({ status: 0, message: i18n.__("INVALID_PASSWORD") });
            //     }
            // }

            const status = await (new CommonService()).verifyPassword({ password: this.req.body.password, savedPassword: user.password });
            if (!status) {
                return exportLib.Error.handleError(this.res, { status: 0, code: 'UNPROCESSABLE_ENTITY', message: exportLib.ResponseEn.INVALID_PASSWORD });
                //return this.res.send({ status: 0, message: i18n.__("INVALID_PASSWORD") });
            }

            data['lastSeen'] = new Date();
            let updatedUser = await Users.findByIdAndUpdate(user._id, data, { new: true }).select(userProjection.user);

            updatedUser['rolePermission'] = [];
            if (updatedUser.role == 'vendor') {
                let vendorRole = await RolesSchema.findOne({ role: "Vendor" });
                if (!_.isEmpty(vendorRole)) {
                    updatedUser['rolePermission'] = await (new RoleService()).getPermissionsOfUser({ roleId: vendorRole._id });
                }
            }
            let response = {
                "_id": updatedUser._id,
                "role": updatedUser.role,
                "emailId": updatedUser.emailId,
                "fullName": updatedUser.fullName,
                "address": updatedUser.address,
                "latitude": updatedUser.latitude,
                "longitude": updatedUser.longitude,
                "mobile": updatedUser.mobile,
                "countryCode": updatedUser.countryCode,
                "photo": updatedUser.photo,
                "area": updatedUser.area,
                "isProfileCompleted": updatedUser.isProfileCompleted ? updatedUser.isProfileCompleted : false,
                "isAvailable": updatedUser.isAvailable ? updatedUser.isAvailable : false,
                "rolePermission": updatedUser['rolePermission'],
                "isPizzaResturant": updatedUser['isPizzaResturant'] ? updatedUser['isPizzaResturant'] : false,
                "bio": updatedUser['bio'] ? updatedUser['bio'] : "",
                "restaurantLogo": updatedUser['restaurantLogo'] ? updatedUser['restaurantLogo'] : ''
            }
            if (updatedUser.role == 'user') {
                response["stripeCustomerId"] = updatedUser.stripeCustomerId ? updatedUser.stripeCustomerId : "";
            }
            let token = await new Globals().getToken({ id: user._id });
            return exportLib.Response.handleResponse(this.res, { status: 1, code: 'OK', message: exportLib.ResponseEn.LOGIN_SUCCESS, data: response }, token);

            //}
        } catch (error) {
            console.log(error);
            return exportLib.Error.handleError(this.res, { status: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
    /********************************************************
    Purpose: Change Password
    Parameter:
        {
            "oldPassword":"password",
            "newPassword":"newpassword"
        }
    Return: JSON String
   ********************************************************/
    async changePassword() {
        try {
            const user = this.req.currentUser;
            if (user.password == undefined) {
                return exportLib.Error.handleError(this.res, { status: 0, code: 'UNPROCESSABLE_ENTITY', message: exportLib.ResponseEn.CANNOT_CHANGE_PASSWORD });
            }
            let passwordObj = {
                oldPassword: this.req.body.oldPassword,
                newPassword: this.req.body.newPassword,
                savedPassword: user.password
            };
            let password = await (new CommonService()).changePasswordValidation({ passwordObj });
            if (typeof password.status !== 'undefined' && password.status == 0) {
                //return this.res.send(password);
                return exportLib.Error.handleError(this.res, { status: 0, code: 'UNPROCESSABLE_ENTITY', message: password.message });
            }

            let updateData = { password: password, passwordUpdatedAt: new Date() };
            if (Config.storePreviouslyUsedPasswords && Config.storePreviouslyUsedPasswords == 'true') {
                updateData = { password: password, $push: { previouslyUsedPasswords: user.password }, passwordUpdatedAt: new Date() };
            }

            const updatedUser = await Users.findByIdAndUpdate(user._id, updateData, { new: true });
            return !updatedUser ? exportLib.Error.handleError(this.res, { status: 0, code: 'UNPROCESSABLE_ENTITY', message: exportLib.ResponseEn.PASSWORD_NOT_UPDATED }) : exportLib.Response.handleMessageResponse(this.res, { status: 1, code: 'OK', message: exportLib.ResponseEn.PASSWORD_UPDATED_SUCCESSFULLY })

        } catch (error) {
            console.log("error- ", error);
            return exportLib.Error.handleError(this.res, { status: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
    /********************************************************
    Purpose: Edit profile
    Parameter:
        {
            "firstName": "firstName",
            "lastName": "lastName",
            "userName": "userName",
            "photo": "photo"
        }
    Return: JSON String
   ********************************************************/
    async editUserProfile() {
        try {
            const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";
            let form = new Form(this.req);
            let formObject = await form.parse();
            const file = new File(formObject.files);
            let filePath = "";
            if (Config.s3upload && Config.s3upload == 'true') {
                filePath = file.uploadFileOnS3(formObject.files.file[0]);
            }
            else {
                if (!_.isEmpty(formObject.files)) {
                    filePath = await file.store();
                }
            }
            // check mobile is exist or not
            let filterMobile = formObject.fields.mobile[0]
            const checkMobile = await Users.findOne({ _id: { $ne: currentUser }, countryCode: formObject.fields.countryCode[0], mobile: filterMobile });
            if (!_.isEmpty(checkMobile) && (checkMobile.mobile)) {
                return exportLib.Error.handleError(this.res, { status: 0, code: 'CONFLICT', message: exportLib.ResponseEn.DUPLICATE_MOBILE });
            }
            let setObject = {}

            formObject.fields.fullName ? (setObject.fullName = formObject.fields.fullName[0]) : delete setObject.fullName;
            formObject.fields.address ? (setObject.address = formObject.fields.address[0]) : delete setObject.address;
            formObject.fields.bio ? (setObject.bio = formObject.fields.bio[0]) : delete setObject.bio;
            formObject.fields.latitude ? (setObject.latitude = formObject.fields.latitude[0]) : delete setObject.latitude;
            formObject.fields.longitude ? (setObject.longitude = formObject.fields.longitude[0]) : delete setObject.longitude;
            formObject.files.photo ? (setObject.photo = filePath.filePath) : delete setObject.photo;
            if (formObject.fields.mobile) {
                setObject.mobile = formObject.fields.mobile[0]
            }
            if (formObject.fields.countryCode) {
                setObject.countryCode = formObject.fields.countryCode[0]
            }

            if (formObject.fields && formObject.fields['address'] != undefined) {
                let latitude = Number(formObject.fields.latitude[0])
                let longitude = Number(formObject.fields.longitude[0])
                setObject['geoLocation'] = { "type": "Point", coordinates: [longitude, latitude] }
            }



            const updatedUser = await Users.findByIdAndUpdate(currentUser, setObject, { new: true }).select(userProjection.user);
            let response = {
                "_id": updatedUser._id,
                "role": updatedUser.role,
                "emailId": updatedUser.emailId,
                "fullName": updatedUser.fullName,
                "address": updatedUser.address,
                "bio": updatedUser.bio,
                "latitude": updatedUser.latitude,
                "longitude": updatedUser.longitude,
                "mobile": updatedUser.mobile,
                "countryCode": updatedUser.countryCode,
                "photo": updatedUser.photo,
            }
            return exportLib.Response.handleResponse(this.res, { status: 1, code: 'OK', message: exportLib.ResponseEn.LOGIN_SUCCESS, data: response });
        } catch (error) {
            console.log("error = ", error);
            let message = await exportLib.ErrorHandle.errorHandle(error, UserSchema);
            return exportLib.Error.handleError(this.res, { status: false, code: 'INTERNAL_SERVER_ERROR', message: message ? message : error.message });
            // return exportLib.Error.handleError(this.res, { status: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }
    /********************************************************
     Purpose: user details
     Parameter:
     {
        "uid": "5ad5d198f657ca54cfe39ba0"
     }
     Return: JSON String
     ********************************************************/
    async userProfile() {
        try {
            const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";
            let user = await Users.findOne({ _id: currentUser }, userProjection.user).lean();
            let response = {
                "_id": user._id,
                "role": user.role,
                "emailId": user.emailId,
                "fullName": user.fullName,
                "address": user.address,
                "bio": user.bio,
                "latitude": user.latitude,
                "longitude": user.longitude,
                "mobile": user.mobile,
                "countryCode": user.countryCode,
                "photo": user.photo,
                "stripeCustomerId": user.stripeCustomerId,
            }

            return _.isEmpty(user) ? exportLib.Error.handleError(this.res, { status: 0, code: 'NOT_FOUND', message: exportLib.ResponseEn.USER_NOT_EXIST }) : exportLib.Response.handleResponse(this.res, { status: 1, code: 'OK', message: exportLib.ResponseEn.LOGIN_SUCCESS, data: response });

        } catch (error) {
            console.log("error- ", error);
            return exportLib.Error.handleError(this.res, { status: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
    }

    /********************************************************
     Purpose: verified user
     Parameter:
     {
        token:""
     }
     Return: JSON String
     ********************************************************/
    async verifyUser() {
        let _this = this;
        try {
            let user = await Users.findOne({ verificationToken: _this.req.query.token });
            if (_.isEmpty(user)) {
                return _this.res.send({ status: 0, message: i18n.__("INVALID_TOKEN") });
            }

            const decoded = await Globals.decodeUserVerificationToken(this.req.query.token);
            if (!decoded) {
                return _this.res.send({ status: 0, message: i18n.__("LINK_EXPIRED") });
            }

            const updateUser = await Users.findByIdAndUpdate(user._id, { emailVerificationStatus: true }, { new: true });
            if (_.isEmpty(updateUser)) {
                return _this.res.send({ status: 0, message: i18n.__("USER_NOT_UPDATED") });
            }
            fs.readFile('public/verification-success.html', null, function (error, data) {
                if (error) {
                    return _this.res.send({ status: 0, message: i18n.__("SERVER_ERROR") });
                }
                _this.res.writeHead(200, { 'Content-Type': 'text/html' });
                _this.res.write(data);
                _this.res.end();
            });
            // return _this.res.send({ status: 1, message: i18n.__("USER_VERIFIED") });

        } catch (error) {
            console.log("error = ", error);
            return _this.res.send({ status: 0, message: i18n.__("SERVER_ERROR") });
        }
    }
    /********************************************************
     Purpose: Logout User
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    async logout() {
        try {
            const currentUser = this.req.currentUser ? this.req.currentUser : {};
            if (currentUser && currentUser._id) {
                let params = { token: null };
                let filter = { userId: currentUser._id };
                await Authentication.update(filter, { $set: params });
                this.res.send({ status: 1, message: i18n.__("LOGOUT_SUCCESS") });
            } else {
                return this.res.send({ status: 0, message: i18n.__("USER_NOT_EXIST") });
            }

        } catch (error) {
            console.log('error', error);
            this.res.send({ status: 0, message: error });
        }

    }
    /********************************************************
     Purpose: Refresh AccessToken
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    async refreshAccessToken() {
        try {
            if (!this.req.headers.refreshtoken) {
                return this.res.send({ status: 0, message: i18n.__("SEND_PROPER_DATA") });
            }
            let token = await (new Globals()).refreshAccessToken(this.req.headers.refreshtoken);
            return this.res.send(token);
        } catch (error) {
            console.log("error = ", error);
            this.res.send({ status: 0, message: i18n.__("SERVER_ERROR") });
        }
    }
    /********************************************************
    Purpose: Single File uploading
    Parameter:
    {
           "file":
    }
    Return: JSON String
    ********************************************************/
    async fileUpload() {
        try {
            let form = new Form(this.req);
            let formObject = await form.parse();
            if (_.isEmpty(formObject.files)) {
                return this.res.send({ status: 0, message: i18n.__("%s REQUIRED", 'File') });
            }
            const file = new File(formObject.files);
            let filePath = "";
            if (Config.s3upload && Config.s3upload == 'true') {
                filePath = file.uploadFileOnS3(formObject.files.file[0]);
            }
            else {
                let fileObject = await file.store();
                /***** uncommit this line to do manipulations in image like compression and resizing ****/
                // let fileObject = await file.saveImage();
                filePath = fileObject.filePath;
            }
            this.res.send({ status: 1, data: { filePath } });

        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
     Purpose: social Access (both signUp and signIn)
     Parameter:
         {
             "socialId":"12343434234",
             "socialKey":"fbId"
             "mobile":"987654321",
             "emailId":"john@grr.la"
             "firstName":"john",
             "lastName":"deo",
             "userName":"john123",
             "device":" ",
             "deviceToken":" "
         }
     Return: JSON String
     ********************************************************/
    async socialAccess() {
        let _this = this;
        try {

            ///console.log(testing,'testing')
            /***** storing every details coming from request body ********/
            let details = _this.req.body;
            let socialKey = details.socialKey
            details['role'] = 'user';
            /****** dynamic socialKey (socialKey may be fbId, googleId, twitterId, instagramId) ********/
            details[socialKey] = details.socialId

            details['emailVerificationStatus'] = true;
            details['isVerifyByAdmin'] = true;

            /***** checking whether we are getting proper socialKey or not ******/
            let checkingSocialKey = _.includes(['fbId', 'googleId', 'appleId'], details.socialKey);
            if (!checkingSocialKey) {
                //return _this.res.send({ status: 0, message: i18n.__("PROPER_SOCIALKEY") })
                return exportLib.Error.handleError(this.res, { status: 0, code: 'UNPROCESSABLE_ENTITY', message: exportLib.ResponseEn.PROPER_SOCIALKEY });
            }
            /****** query for checking socialId is existing or not *********/
            let filter = { [socialKey]: _this.req.body.socialId }

            /**** checking user is existing or not *******/
            let user = await Users.findOne(filter, userProjection.user);

            /**** if user not exists with socialId *****/
            if (_.isEmpty(user)) {

                if (_this.req.body.emailId) {
                    /******** checking whether user is already exists with emailId or not *******/
                    let userDetails = await Users.findOne({ emailId: _this.req.body.emailId }, userProjection.user);

                    /****** If user not exists with above emailId *******/
                    if (_.isEmpty(userDetails)) {
                        /******** This is the signUp process for socialAccess with emailId *****/
                        let newUser = await this.createSocialUser(details);
                        //return _this.res.send(newUser)
                        return exportLib.Response.handleResponse(this.res, { status: 1, code: 'OK', message: exportLib.ResponseEn.LOGIN_SUCCESS, data: newUser.data }, newUser.access_token)
                    }
                    else {
                        /**** social access code *****/
                        let updatedUser = await this.checkingSocialIdAndUpdate(userDetails, details);
                        return updatedUser.status = 1 ? exportLib.Response.handleResponse(this.res, { status: 1, code: 'OK', message: exportLib.ResponseEn.LOGIN_SUCCESS, data: updatedUser.data }, updatedUser.access_token) : exportLib.Error.handleError(this.res, { status: 0, code: 'UNPROCESSABLE_ENTITY', message: updatedUser.message });
                        //return _this.res.send(updatedUser)
                    }
                }
                else {
                    /******** This is the signUp process for socialAccess without emailId *****/
                    let newUser = await this.createSocialUser(details);
                    return exportLib.Response.handleResponse(this.res, { status: 1, code: 'OK', message: exportLib.ResponseEn.LOGIN_SUCCESS, data: newUser.data }, newUser.access_token)
                }
            }
            /****** if user exists with socialId ******/
            else {
                if (_this.req.body.emailId) {
                    /******** to check whether is already exists with emailId or not *******/
                    let userDetails = await Users.findOne({ emailId: _this.req.body.emailId });

                    /****** If user not exists with above emailId *******/

                    if (_.isEmpty(userDetails)) {
                        /****** updating details in existing user with socialId details *****/
                        let updatedUser = await this.updateSocialUserDetails(details);
                        return updatedUser.status = 1 ? exportLib.Response.handleResponse(this.res, { status: 1, code: 'OK', message: exportLib.ResponseEn.LOGIN_SUCCESS, data: updatedUser.data }, updatedUser.access_token) : exportLib.Error.handleError(this.res, { status: 0, code: 'UNPROCESSABLE_ENTITY', message: updatedUser.message });
                        // return _this.res.send(updatedUser)
                    } else {
                        /**** social access code *****/
                        let updatedUser = await this.checkingSocialIdAndUpdate(userDetails, details);
                        updatedUser.data.photo
                        return updatedUser.status = 1 ? exportLib.Response.handleResponse(this.res, { status: 1, code: 'OK', message: exportLib.ResponseEn.LOGIN_SUCCESS, data: updatedUser.data }, updatedUser.access_token) : exportLib.Error.handleError(this.res, { status: 0, code: 'UNPROCESSABLE_ENTITY', message: updatedUser.message });
                        //return _this.res.send(updatedUser)
                    }
                }
                else {
                    /****** updating details in existing user with emailId details ********/
                    let updatedUser = await this.updateSocialUserDetails(details);
                    return exportLib.Response.handleResponse(this.res, { status: 1, code: 'OK', message: exportLib.ResponseEn.LOGIN_SUCCESS, data: updatedUser.data }, updatedUser.access_token)
                }
            }
        }
        catch (error) {
            console.log(error)
            _this.res.send({ status: 0, message: error });
        }
    }

    /******** Create Users through socialIds ******/
    createSocialUser(details) {
        return new Promise(async (resolve, reject) => {
            try {
                let newUser = await new Model(Users).store(details);
                if (Config.useRefreshToken && Config.useRefreshToken == 'true') {
                    let { token, refreshToken } = await new Globals().getTokenWithRefreshToken({ id: newUser._id });
                    resolve({ status: 1, message: i18n.__("LOGIN_SUCCESS"), access_token: token, refreshToken: refreshToken, data: newUser });
                } else {
                    let token = await new Globals().getToken({ id: newUser._id });
                    resolve({ status: 1, message: i18n.__("LOGIN_SUCCESS"), access_token: token, data: newUser });
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /******** Create Users through socialIds ******/
    updateSocialUserDetails(details) {
        return new Promise(async (resolve, reject) => {
            try {
                let updatedUser = await Users.findOneAndUpdate({ [details.socialKey]: details.socialId }, details, { upsert: true, new: true }).select(userProjection.user);
                if (Config.useRefreshToken && Config.useRefreshToken == 'true') {
                    let { token, refreshToken } = await new Globals().getTokenWithRefreshToken({ id: updatedUser._id });
                    resolve({ status: 1, message: i18n.__("LOGIN_SUCCESS"), access_token: token, refreshToken: refreshToken, data: updatedUser });
                } else {
                    let token = await new Globals().getToken({ id: updatedUser._id });
                    resolve({ status: 1, message: i18n.__("LOGIN_SUCCESS"), access_token: token, data: updatedUser });
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    /******** Create Users through socialIds ******/
    checkingSocialIdAndUpdate(userDetails, details) {
        return new Promise(async (resolve, reject) => {
            try {
                if (userDetails[details.socialKey] && userDetails[details.socialKey] !== details.socialId) {
                    resolve({ status: 0, message: i18n.__("LINK_WITH_ANOTHER_SOCIAL_ACCOUNT") });
                }
                /****** updating details in existing user with emailId details ********/

                await Users.findOneAndUpdate({ emailId: details.emailId }, details, { upsert: true, new: true }).select(userProjection.user);
                let updatedUser = await Users.findOne({ emailId: details.emailId })
                // console.log(updatedUser,'update')
                if (Config.useRefreshToken && Config.useRefreshToken == 'true') {
                    let { token, refreshToken } = await new Globals().getTokenWithRefreshToken({ id: updatedUser._id });
                    resolve({ status: 1, message: i18n.__("LOGIN_SUCCESS"), access_token: token, refreshToken: refreshToken, data: updatedUser });
                } else {
                    let token = await new Globals().getToken({ id: updatedUser._id });
                    resolve({ status: 1, message: i18n.__("LOGIN_SUCCESS"), access_token: token, data: updatedUser });
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    async asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }
}
module.exports = UsersController;