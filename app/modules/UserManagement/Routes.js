
module.exports = (app, express) => {

    const router = express.Router();

    const Globals = require("../../../configs/Globals");
    const UserManagementController = require('../UserManagement/Controller');
    const config = require('../../../configs/configs');
    const Users = require('../User/Schema').Users;
    const Validators = require("./Validator");
    const expressListRoutes = require('../../services/Routes');
    
    let obj = { columnKey: "userListing", key: "userListing", model: Users };

    router.get('/user/userProfile/:userId', Globals.isAdminAuthorised(['user_view_list']), Validators.detailValidator(), Validators.validate, (req, res, next) => {
        req.model = obj.model;
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.userProfile();
    });

    router.post('/user/deleteUsers', Globals.isAdminAuthorised(['user_delete']), Validators.deleteValidator(), Validators.validate, (req, res, next) => {
        req.body = { ...req.body, ...obj };
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.deleteUsers();
    });

    router.post('/user/changeStatus', Globals.isAdminAuthorised(['user_status_update']), Validators.statusValidator({ key: 'userIds' }), Validators.validate, (req, res, next) => {
        req.body = { ...req.body, ...obj };
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.changeStatus();
    });
    router.get('/user/approveUser/:userId', Globals.isAdminAuthorised(), Validators.approveUserValidator(), Validators.validate, (req, res, next) => {
        req.body = { ...req.body, ...obj };
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.approveUser();
    });
    router.get('/user/resendVerificationMail/:userId', Globals.isAdminAuthorised(), Validators.approveUserValidator(), Validators.validate, (req, res, next) => {
        req.body = { ...req.body, ...obj };
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.resendVerificationMail();
    });

    router.post('/user/userListing', Globals.isAdminAuthorised(['user_view_list']), Validators.listingValidator(), Validators.validate, (req, res, next) => {
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.userListing();
    });

    router.post('/downloadUserFile', Globals.isAdminAuthorised(), Validators.downloadValidator({ key: 'userIds' }), Validators.validate, (req, res, next) => {
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.downloadUserFile();
    });

    router.post('/user/addUserByAdmin', Globals.isAdminAuthorised(), Validators.addUserByAdmin(), Validators.validate, (req, res, next) => {
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.addUserByAdmin();
    });
    router.post('/user/addUser', Globals.isAdminAuthorised(), (req, res, next) => {
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.addUser();
    });

    global.routes.push(expressListRoutes(router));
    app.use(config.baseApiUrl, router);
}