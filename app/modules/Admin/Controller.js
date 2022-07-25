const i18n = require("i18n");
const _ = require('lodash');

const Controller = require('../Base/Controller');
const Model = require("../Base/Model");
const Globals = require('../../../configs/Globals');
const Admin = require('./Schema').Admin;
const CommonService = require("../../services/Common");
const RoleService = require("../Roles/Service");
const RequestBody = require("../../services/RequestBody");
const Authentication = require('../Authentication/Schema').Authtokens;
const adminProjection = require('../Admin/Projection');
const config = require('../../../configs/configs');
const Moment = require("moment");

class AdminController extends Controller {

    constructor() {
        super();
    }
    /********************************************************
     Purpose: Get AllEndpoints
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    async getAllEndpoints() {
        try {
            const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";
            const admin = await Admin.findOne({ _id: currentUser }, adminProjection.admin);
            return _.isEmpty(admin) ? this.res.send({ status: 0, message: i18n.__("USER_NOT_EXIST") }) : this.res.send({ status: 1, data: [].concat(...global.routes) });
        } catch (error) {
            console.log('error', error);
            this.res.send({ status: 0, message: error });
        }
    }
    /********************************************************
     Purpose: Get Admin profile details
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    async profile() {
        try {
            const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";
            const admin = await Admin.findOne({ _id: currentUser }, adminProjection.admin);
            return _.isEmpty(admin) ? this.res.send({ status: 0, message: i18n.__("USER_NOT_EXIST") }) : this.res.send({ status: 1, data: admin });
        } catch (error) {
            console.log('error', error);
            this.res.send({ status: 0, message: error });
        }
    }
    /********************************************************
     Purpose: Update admin profile details
     Parameter:
     {
            "photo":"abc.jpg"
            "mobile":"987654321",
            "firstname":"john",
            "lastname":"deo"
     }
     Return: JSON String
     ********************************************************/
    async editProfile() {
        try {
            const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";
            // let fieldsArray = ['firstname', 'lastname', 'mobile', 'photo'];
            let fieldsArray = ['firstname', 'lastname', 'photo', 'dob', 'website', 'gender', 'address', 'country', 'fbLink', 'twitterLink', 'instagramLink', 'gitHubLink', 'slack', 'codePen'];
            let userData = await (new RequestBody()).processRequestBody(this.req.body, fieldsArray);
            if (userData.photo) {
                userData.photo = _.last(userData.photo.split("/"));
            }
            // if (userData.firstname && userData.lastname) {
            //     userData.username = userData.firstname + " " + userData.lastname;
            // }
            const updatedAdmin = await Admin.findByIdAndUpdate(currentUser, userData, { new: true }).select(adminProjection.admin);
            return _.isEmpty(updatedAdmin) ? this.res.send({ status: 0, message: i18n.__("USER_NOT_EXIST") }) : this.res.send({ status: 1, data: updatedAdmin });
        } catch (error) {
            console.log(error);
            this.res.send({ status: 0, message: error });
        }
    }
    /********************************************************
     Purpose: Change password
     Parameter:
     {
        "oldPassword":"test123",
        "newPassword":"test123"
     }
     Return: JSON String
     ********************************************************/
    async changePassword() {
        try {
            const user = this.req.currentUser;
            let passwordObj = {
                oldPassword: this.req.body.oldPassword,
                newPassword: this.req.body.newPassword,
                savedPassword: user.password
            };
            let password = await (new CommonService()).changePasswordValidation({ passwordObj });
            if (typeof password.status !== 'undefined' && password.status == 0) {
                return this.res.send(password);
            }
            const updatedUser = await Admin.findByIdAndUpdate(user._id, { password: password }, { new: true });
            return !updatedUser ? this.res.send({ status: 0, message: i18n.__("PASSWORD_NOT_UPDATED") }) : this.res.send({ status: 1, message: i18n.__("PASSWORD_UPDATED_SUCCESSFULLY") });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }
    /********************************************************
     Purpose: Forgot password
     Parameter:
     {
            "oldPassword":"test123",
            "newPassword":"test123"
     }
     Return: JSON String
     ********************************************************/
    async adminForgotPasswordMail() {
        let _this = this;
        try {
            let emailId = this.req.body.emailId;
            let user = await Admin.findOne({ emailId: emailId });
            if (_.isEmpty(user)) {
                return this.res.send({ status: 0, message: i18n.__("REGISTERED_EMAIL") })
            }
            let globalObj = new Globals();
            const token = await globalObj.generateOtpToken(user._id);
            await Admin.findByIdAndUpdate(user._id, { forgotToken: token, forgotTokenCreationTime: new Date() });

            let emailData = {
                emailId: emailId,
                emailKey: 'forgot_password_mail',
                replaceDataObj: { fullName: user.fullName, token: token }
            };

            const sendingMail = await new Email().sendMail(emailData);
            if (sendingMail) {
                if (sendingMail.status == 0) {
                    return _this.res.send(sendingMail);
                } else if (!sendingMail.response) {
                    return this.res.send({ status: 0, message: i18n.__("SERVER_ERROR") });
                }
            }
            return this.res.send({ status: 1, message: i18n.__("CHECK_EMAIL") });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }
    /********************************************************
     Purpose: Reset password
     Parameter:
     {
            "token": "",
            "password":""
     }
     Return: JSON String
     ********************************************************/
    async resetPasswordAdmin() {
        try {
            let user = await Admin.findOne({ forgotToken: this.req.body.token, emailId: this.req.body.email });
            if (_.isEmpty(user)) {
                return this.res.send({ status: 0, message: i18n.__("INVALID_TOKEN") });
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

            const updateUser = await Admin.findByIdAndUpdate(user._id, { password: password, forgotToken: "", forgotTokenCreationTime: "" }, { new: true });
            if (_.isEmpty(updateUser)) {
                return this.res.send({ status: 0, message: i18n.__("PASSWORD_NOT_UPDATED") });
            }
            await Admin.findByIdAndUpdate(user._id, { forgotToken: "", forgotTokenCreationTime: "" });
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
            "emailId": "",
            "password":""
     }
     Return: JSON String
     ********************************************************/
    async adminLogin() {
        let _this = this;
        try {
            let fieldsArray = ["authName", "password"];
            let emptyFields = await (new RequestBody()).checkEmptyWithFields(_this.req.body, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return _this.res.send({ status: 0, message: i18n.__('SEND_PROPER_DATA') + " " + emptyFields.toString() + " fields required." });
            }
            fieldsArray = [...fieldsArray, "deviceToken", "device"];
            let data = await (new RequestBody()).processRequestBody(_this.req.body, fieldsArray);

            let query = { $or: [{ emailId: data.authName.toString().toLowerCase() }, { mobile: '+91-' + data.authName }] };
            const user = await Admin.findOne(query);

            if (_.isEmpty(user)) {
                return _this.res.send({ status: 0, message: i18n.__("USER_NOT_EXIST") });
            }
            if (!user.emailVerificationStatus) {
                return _this.res.send({ status: 1, message: i18n.__("VERIFY_EMAIL") });
            }
            // if (!_.isEmpty(user.mobile) && user.role.role == 'Vendor') {
            // if (!_.isEmpty(user.mobile)) {
            //     if (!user.otpVerificationStatus) {
            //         return _this.res.send({ status: 1, message: i18n.__("VERIFY_MOBILE") });
            //     }
            // }
            if (!user.password) {
                return _this.res.send({ status: 0, message: i18n.__("SET_PASSWORD") });
            }
            const status = await (new CommonService()).verifyPassword({ password: data.password, savedPassword: user.password });
            if (!status) {
                return _this.res.send({ status: 0, message: i18n.__("INVALID_PASSWORD") });
            }

            let tokenData = { id: user._id };
            let obj = { lastSeen: new Date() };

            tokenData['ipAddress'] = _this.req.ip;
            let token = await (new Globals()).AdminToken(tokenData);
            let updatedUser = await Admin.findByIdAndUpdate(user._id, obj, { new: true }).select(adminProjection.admin);

            // Logic to get role permission
            let userData = JSON.parse(JSON.stringify(updatedUser));
            userData['rolePermission'] = await (new RoleService()).getPermissionsOfUser({ roleId: updatedUser.role._id ? updatedUser.role._id : updatedUser.role });
            return _this.res.send({ status: 1, message: i18n.__("LOGIN_SUCCESS"), access_token: token, data: userData });

        } catch (error) {
            console.log("error", error);
            return this.res.send({ status: 0, message: i18n.__('SERVER_ERROR') });
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
            if (config.s3upload && config.s3upload == 'true') {
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
    async getMetaText() {
        let data = [
            "Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
            "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur",

            "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        ]
        this.res.send({ status: 1, data })
    }
    /********************************************************
     Purpose: Logout Admin
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    async logout() {
        try {
            const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";
            await Authentication.update({ adminId: currentUser, ipAddress: this.req.body.ip }, { $set: { token: null } });
            this.res.send({ status: 1, message: i18n.__("LOGOUT_SUCCESS"), data: {} });
        } catch (error) {
            console.log('error', error);
            this.res.send({ status: 0, message: error });
        }

    }


}
module.exports = AdminController