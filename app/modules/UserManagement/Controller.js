const _ = require("lodash");
const i18n = require("i18n");

const Model = require("../Base/Model");
const Controller = require("../Base/Controller");
const Users = require('../User/Schema').Users;
const UserSchema = require('../User/Schema').user;
const CommonService = require("../../services/Common");
const Globals = require('../../../configs/Globals');
const userProjection = require('./Projection');
const Email = require('../../services/Email');
const config = require('../../../configs/configs');

class UserManagementController extends Controller {

    constructor() {
        super();
    }
    async asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }
    /********************************************************
    Purpose: user listing
    Parameter:
    {
        "page":1,
        "pagesize":10,
        "columnKey":"userListing",
        "filter": [{"firstName": ["Neha","Madhuri"]},{"lastName":["Bhavsar","Dodla"]}]
        OR 
        "filter": [{"role": ["5d5a8746d9a42e120e2d9700"]}]
    }
    Return: JSON String
    ********************************************************/
    async userListing() {
        try {
            this.req.body['model'] = Users;
            this.req.body['adminId'] = this.req.currentUser._id;
            let data = {
                bodyData: this.req.body,
                selectObj: userProjection.user,
            };
            /**** if search is required ******/
            if (this.req.body.searchText) {
                data.fieldsArray = ['firstName', 'lastName', 'businessName', 'emailId', 'mobile', 'userName', 'fullName']
                data.searchText = this.req.body.searchText;
            }
            let result = await new CommonService().listing(data);
            return this.res.send(result);
        }
        catch (error) {
            console.log(error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
     Purpose: single and multiple user delete
     Parameter:
     {
        "userIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"]
     }
     Return: JSON String
     ********************************************************/
    async deleteUsers() {
        try {
            let model = this.req.body.model ? this.req.body.model : Users;
            let msg = 'User not deleted.';
            const updatedUser = await model.updateMany({ _id: { $in: this.req.body.userIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedUser) {
                msg = updatedUser.nModified ? updatedUser.nModified + ' user deleted.' : updatedUser.n == 0 ? i18n.__("USER_NOT_EXIST") : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
     Purpose: single and multiple user 's change status
     Parameter:
     {
        "userIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
        "status":true
     }
     Return: JSON String
     ********************************************************/
    async changeStatus() {
        try {
            let model = this.req.model ? this.req.model : Users;
            let msg = 'User not updated.';
            const updatedUser = await model.updateMany({ _id: { $in: this.req.body.userIds } }, { $set: { status: this.req.body.status } });
            if (updatedUser) {
                msg = updatedUser.nModified ? updatedUser.nModified + ' user updated.' : updatedUser.n == 0 ? i18n.__("USER_NOT_EXIST") : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
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
            let model = this.req.model ? this.req.model : Users;
            let user = await model.findOne({ _id: this.req.params.userId }, userProjection.user).populate('country', { countryName: 1, phoneCode: 1, countryCode: 1 });
            return this.res.send(_.isEmpty(user) ? { status: 0, message: i18n.__("USER_NOT_EXIST") } : { status: 1, data: user });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
     Purpose: Get Filters
     Parameter:Delete
     Return: JSON String
     ********************************************************/
    async deleteFilter() {
        try {
            let result = await FilterSettings.deleteOne({ _id: this.req.params.filterId });
            if (result.ok && result.deletedCount) {
                return this.res.send({ status: 1, data: result, message: i18n.__("DELETED_SUCCESSFULLY"), });
            } else if (result.ok && result.n == 0) {
                return this.res.send({ status: 0, message: i18n.__("NOT_FOUND"), });
            } else {
                return this.res.send({ status: 0, message: i18n.__("NOT_DELETED"), });
            }
        }
        catch (error) {
            console.log(error);
            this.res.send({ status: 0, message: error });
        }
    }
    /********************************************************
     Purpose: verified user
     Parameter:
     {
        userId:""
     }
     Return: JSON String
     ********************************************************/
    async approveUser() {
        try {
            let model = this.req.model ? this.req.model : Users;
            let user = await model.findById(this.req.params.userId);
            if (_.isEmpty(user)) {
                return this.res.send({ status: 0, message: i18n.__("NOT_FOUND") });
            }
            if (user.isVerifyByAdmin) {
                return this.res.send({ status: 0, message: i18n.__("USER_APPROVED_ALREADY") });
            }
            if (_.includes(['vendor', 'driver'], user.role)) {
                const updateUser = await model.findByIdAndUpdate(this.req.params.userId, { isVerifyByAdmin: true }, { new: true });
                if (_.isEmpty(updateUser)) {
                    return this.res.send({ status: 0, message: i18n.__("USER_NOT_UPDATED") });
                } else {
                    return this.res.send({ status: 1, message: i18n.__("USER_APPROVED") });
                }
            } else {
                return this.res.send({ status: 0, message: i18n.__("USER_MUST_BE_DRIVER_OR_VENDOR") });
            }
        } catch (error) {
            console.log("error = ", error);
            return this.res.send({ status: 0, message: i18n.__("SERVER_ERROR") });
        }
    }
    /********************************************************
     Purpose: resendVerificationMail
     Parameter:
     {
        userId:""
     }
     Return: JSON String
     ********************************************************/
    async resendVerificationMail() {
        try {
            let model = this.req.model ? this.req.model : Users;
            let user = await model.findById(this.req.params.userId);
            if (_.isEmpty(user)) {
                return this.res.send({ status: 0, message: i18n.__("NOT_FOUND") });
            }
            if (user.emailVerificationStatus) {
                return this.res.send({ status: 0, message: i18n.__("USER_VERIFIED_ALREADY") });
            }
            if (_.includes(['vendor', 'driver', 'user'], user.role)) {
                const token = await new Globals().generateToken(this.req.params.userId);
                //sending mail to verify user
                let emailData = {
                    emailId: user.emailId,
                    emailKey: 'signup_mail',
                    replaceDataObj: { emailId: user.emailId, verificationLink: config.rootUrl + '/users/verifyUser?token=' + token }
                };
                await new Email().sendMail(emailData);
                let updateUser = await Users.findByIdAndUpdate(this.req.params.userId, { verificationToken: token, verificationTokenCreationTime: new Date() });
                if (_.isEmpty(updateUser)) {
                    return this.res.send({ status: 0, message: i18n.__("USER_NOT_UPDATED") });
                } else {
                    return this.res.send({ status: 1, message: i18n.__("EMAIL_RESEND_SUCCESSFULLY") });
                }
            } else {
                return this.res.send({ status: 0, message: i18n.__("USER_MUST_BE_DRIVER_OR_VENDOR") });
            }
        } catch (error) {
            console.log("error = ", error);
            return this.res.send({ status: 0, message: i18n.__("SERVER_ERROR") });
        }
    }

}
module.exports = UserManagementController;