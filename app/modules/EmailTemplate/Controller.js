const i18n = require("i18n");
const _ = require("lodash");
const ObjectId = require('mongodb').ObjectID;

const Controller = require("../Base/Controller");
const EmailTemplate = require('./Schema').EmailTemplate;
const Model = require("../Base/Model");
const RequestBody = require("../../services/RequestBody");
const CommonService = require("../../services/Common");

class EmailTemplateController extends Controller {

    constructor() {
        super();
    }
    /********************************************************
     Purpose:Email add /update
     Parameter:
     {
         "emailTitle": "Signup Mail"
        "emailContent": "<p><span style="color:#000000; font-family:Arial; font-size:13px">Congratulations {{{fullName}}} for signing up with App. </span></p>"
        "emailKey": "signup_mail"
        "id": "5ccffeb4c4240e0852606f5d"
        "subject": "Welcome Message"
     }
     Return: JSON String
     ********************************************************/
    async addUpdateEmail() {
        let _this = this;
        try {
            let fieldsArray = ['emailKey', 'subject', 'emailContent', 'gjsHtml', 'gjsCss', 'gjsAssets', 'gjsStyles', 'gjsComponents', 'fromEmailId'];
            let data = await (new RequestBody()).processRequestBody(_this.req.body, fieldsArray);
            data['emailTitle'] = data['emailKey'];
            data['emailKey'] = data['emailKey'].replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
            let filter = _this.req.body.id ? { emailKey: data['emailKey'], _id: { $nin: [this.req.body.id] } } : { emailKey: data['emailKey'] };
            let isKeyExist = await EmailTemplate.findOne(filter);
            if (_this.req.body.id) {
                if (isKeyExist) {
                    return _this.res.send({ status: 0, message: i18n.__("EMAIL_TEMPLATE_KEY_UNIQUE") });
                }
                const updatedEmail = await EmailTemplate.findByIdAndUpdate(this.req.body.id, data, { new: true });
                if (_.isEmpty(updatedEmail)) {
                    return _this.res.send({ status: 0, message: i18n.__("EMAIL_TEMPLATE_NOT_UPDATED") });
                }
                return _this.res.send({ status: 1, message: i18n.__("EMAIL_TEMPLATE_UPDATED"), data: updatedEmail })
            }
            else {
                if (_.isEmpty(isKeyExist)) {
                    data['createdById'] = _this.req.currentUser._id;
                    data['createdBy'] = _this.req.currentUser.firstname + ' ' + _this.req.currentUser.lastname;
                    // data['fromEmailId'] = _this.req.body.fromEmailId;
                    const newEmail = await new Model(EmailTemplate).store(data);
                    if (_.isEmpty(newEmail)) {
                        return _this.res.send({ status: 0, message: i18n.__("EMAIL_TEMPLATE_NOT_SAVED") });
                    }
                    return _this.res.send({ status: 1, message: i18n.__("EMAIL_TEMPLATE_SAVED"), data: newEmail });
                } else {
                    const updatedEmail = await EmailTemplate.findOneAndUpdate({ emailKey: data['emailKey'] }, data, { new: true });
                    if (_.isEmpty(updatedEmail)) {
                        return _this.res.send({ status: 0, message: i18n.__("EMAIL_TEMPLATE_NOT_UPDATED") });
                    }
                    return _this.res.send({ status: 1, message: i18n.__("EMAIL_TEMPLATE_UPDATED"), data: updatedEmail });
                }
            }
        } catch (error) {
            console.log(error);
            this.res.send({ status: 0, message: error });
        }
    }
    /********************************************************
     Purpose:List email
     Parameter:
     {
            "page":1,
            "pagesize":10,
            "columnKey":"emailListing"
     }
     Return: JSON String
     ********************************************************/
    async listEmail() {
        try {
            this.req.body['model'] = EmailTemplate;
            this.req.body['adminId'] = this.req.currentUser._id;
            let data = { bodyData: this.req.body }
            data.bodyData.staticFilter = { isDeleted: false }
            /**** if search is required ******/
            if (this.req.body.searchText) {
                data.fieldsArray = ['subject', 'emailKey', 'emailContent', 'emailTitle']
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
     Purpose:delete email
     Parameter:
     {
           ids:['82748049082','2343982uioew3028']
     }
     Return: JSON String
     ********************************************************/
    async deleteEmail() {
        try {
            let msg = 'Email template not deleted.';
            const updatedEmail = await EmailTemplate.updateMany({ _id: { $in: this.req.body.ids } }, { $set: { isDeleted: true } });
            if (updatedEmail) {
                msg = updatedEmail.nModified ? updatedEmail.nModified + ' template deleted.' : updatedEmail.n == 0 ? i18n.__("EMAIL_TEMPLATE_NOT_FOUND") : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            this.res.send({ status: 0, message: error });
        }
    }
    /********************************************************
     Purpose: single and multiple email 's change status
     Parameter:
     {
        "ids":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
        "status":true
     }
     Return: JSON String
     ********************************************************/
    async changeStatus() {
        try {
            let msg = 'Email template not updated.';
            const updatedEmail = await EmailTemplate.updateMany({ _id: { $in: this.req.body.ids } }, { $set: { status: this.req.body.status } });
            if (updatedEmail) {
                msg = updatedEmail.nModified ? updatedEmail.nModified + ' template updated.' : updatedEmail.n == 0 ? i18n.__("EMAIL_TEMPLATE_NOT_FOUND") : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }
    /********************************************************
     Purpose:detail email
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    async detailEmail() {
        try {
            const emailData = await EmailTemplate.findOne({ _id: this.req.params.id, isDeleted: false });
            return this.res.send(_.isEmpty(emailData) ? { status: 0, message: i18n.__("EMAIL_NOT_FOUND") } : { status: 1, data: emailData });
        } catch (error) {
            console.log(error);
            this.res.send({ status: 0, message: error });
        }
    }

}
module.exports = EmailTemplateController;