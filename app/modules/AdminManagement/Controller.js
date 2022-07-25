const i18n = require("i18n");
const _ = require("lodash");
const Transaction = require('mongoose-transactions');

const Controller = require("../Base/Controller");
const Admin = require('../Admin/Schema').Admin;
const AdminSchema = require('../Admin/Schema').admin;
const RolesSchema = require('../Roles/Schema').RolesSchema;
const Model = require("../Base/Model");
const CommonService = require("../../services/Common");
const adminUserProjection = require('./Projection');
const Globals = require('../../../configs/Globals');
const config = require('../../../configs/configs');
const RequestBody = require("../../services/RequestBody");
const exportLib = require("../../../lib/Exports");

class AdminManagementController extends Controller {

    constructor() {
        super();
    }

    /********************************************************
  Purpose: Add admin user
  Parameter:
  {
       "email":"john@doe.com",
       "password":"john",
       "mobile":"987654321",
       "firstname":"john",
       "lastname":"deo",
       "role": "manager"
   }
  Return: JSON String
  ********************************************************/
    async addAdminUser() {
        const transaction = new Transaction();
        try {

            // check emailId is exist or not
            let filter = { "$or": [{ "emailId": this.req.body.emailId.toLowerCase() }] }
            const admin = await Admin.findOne(filter);

            //if admin exist give error
            if (!_.isEmpty(admin) && (admin.emailId)) {
                return this.res.send({ status: 0, message: i18n.__("DUPLICATE_EMAIL_OR_USERNAME") });
            } else {
                let fieldsArray = ["emailId", "firstname", "lastname", "mobile", "role", "photo", "username"]
                let data = await (new RequestBody()).processRequestBody(this.req.body, fieldsArray);
                let role = await RolesSchema.findOne({ _id: data['role'] }, adminUserProjection.roleList);
                if (!role) {
                    return this.res.send({ status: 0, message: i18n.__("ROLE_NOT_FOUND") });
                }
                data['role'] = role;
                data = { ...data, emailVerificationStatus: true, addedBy: this.req.currentUser._id }
                data['emailId'] = data['emailId'].toLowerCase();

                // save new admin

                let newUser = new Admin(data);
                newUser.validate(async (err) => {
                    if (err) {
                        console.log('validation error', err);
                        return this.res.send({ status: 0, message: err })
                    }
                    else {
                        console.log('pass validate');
                        // const newUser = await new Model(Admin).store(data);
                        const newUserId = transaction.insert('Admin', data);
                        console.log('newUser', newUserId);
                        // if empty not save admin details and give error message.
                        if (_.isEmpty(newUserId)) {
                            return this.res.send({ status: 0, message: i18n.__('USER_NOT_SAVED') })
                        }
                        else {
                            const token = await new Globals().generateToken(newUserId);
                            // await Admin.findByIdAndUpdate(newUserId, { forgotToken: token, forgotTokenCreationTime: new Date() });
                            transaction.update('Admin', newUserId, { forgotToken: token, forgotTokenCreationTime: new Date() });
                            //sending mail to verify admin
                            let emailData = {
                                emailId: data['emailId'],
                                emailKey: 'admin_invite_mail',
                                replaceDataObj: { role: data['role'], fullName: data.firstname + " " + data.lastname, verificationLink: config.frontUrl + '/setPassword?token=' + token, verificationLinkAngular: config.frontUrlAngular + '/set-password?token=' + token }
                            };
                            const sendingMail = await new Email().sendMail(emailData);
                            console.log('sendingMail', sendingMail);
                            if (sendingMail && sendingMail.status == 0) {
                                transaction.rollback();
                                return this.res.send(sendingMail);
                            }
                            else if (sendingMail && !sendingMail.response) {
                                transaction.rollback();
                                return this.res.send({ status: 0, message: i18n.__('MAIL_NOT_SEND_SUCCESSFULLY') });
                            }
                            let res = await transaction.run();
                            console.log('res', res);
                            return this.res.send({ status: 1, message: i18n.__('USER_ADDED_SUCCESSFULLY') });
                        }
                    }
                });
            }
        } catch (error) {
            console.log("error = ", error);
            transaction.rollback();
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
            let user = await Admin.findOne({ _id: this.req.params.userId }, adminUserProjection.user);
            return this.res.send(_.isEmpty(user) ? { status: 0, message: i18n.__("USER_NOT_EXIST") } : { status: 1, data: user });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
     Purpose: update admin user
     Parameter:
     {
        "userId":"5ad5d198f657ca54cfe39ba0",
        "password":"john",
        "mobile":"987654321",
        "firstname":"john",
        "lastname":"deo",
        "status":true
     }
     Return: JSON String
     ********************************************************/
    async updateUser() {
        try {
            let fieldsArray = ["firstname", "lastname", "mobile", "role", "userId", "photo", "username"];
            let data = await (new RequestBody()).processRequestBody(this.req.body, fieldsArray);
            let role = await RolesSchema.findOne({ _id: data['role'] }, adminUserProjection.roleList);
            if (role) {
                console.log('role', role);
                data['role'] = role;
                // check emailId is exist or not
                let admin = await Admin.findOne({ _id: data['userId'] });

                //if admin not exist give error
                if (_.isEmpty(admin)) {
                    return this.res.send({ status: 0, message: i18n.__("USER_NOT_EXIST") });
                } else {
                    let userId = data['userId'];
                    delete data['userId'];
                    admin = await Admin.findOneAndUpdate({ _id: userId }, data, { new: true }).select(adminUserProjection.user);
                }
                return this.res.send({ status: 1, data: admin });
            } else {
                return this.res.send({ status: 0, message: i18n.__("ROLE_NOT_FOUND") });
            }

        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
       Purpose: user listing
       Parameter:
       {
            "page":1,
            "pagesize":10,
            "columnKey":"userListing",
            "filter": [{"firstname": ["Neha","mad"]},{"lastname":["dodla"]}]
       }
       Return: JSON String
       ********************************************************/
    async adminUserListing() {
        try {
            this.req.body['model'] = Admin;
            this.req.body['adminId'] = this.req.currentUser._id;
            let data = {
                bodyData: this.req.body,
                query: { 'role.role': { $nin: ['Super Admin'] } },
                selectObj: adminUserProjection.user
            };
            /**** if search is required ******/
            if (this.req.body.searchText) {
                data.fieldsArray = ['firstname', 'lastname', 'emailId', 'mobile', 'username', 'role.role']
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
            let msg = i18n.__("USER_NOT_DELETED");
            const updatedUser = await Admin.updateMany({ _id: { $in: this.req.body.userIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedUser) {
                msg = updatedUser.nModified ? updatedUser.nModified + i18n.__("USER_DELETED") : updatedUser.n == 0 ? i18n.__("USER_NOT_EXIST") : msg;
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
            let msg = i18n.__("USER_NOT_UPDATED");
            const updatedUser = await Admin.updateMany({ _id: { $in: this.req.body.userIds } }, { $set: { status: this.req.body.status } });
            if (updatedUser) {
                msg = updatedUser.nModified ? updatedUser.nModified + i18n.__("USER_UPDATED") : updatedUser.n == 0 ? i18n.__("USER_NOT_EXIST") : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }
}
module.exports = AdminManagementController;