
module.exports = (app, express) => {

    const router = express.Router();

    const Globals = require("../../../configs/Globals");
    const UserManagementController = require('./Controller');
    const config = require('../../../configs/configs');
    const Validators = require("./Validator");
    const expressListRoutes = require('../../services/Routes');
    // let obj = { columnKey: "adminListing", key: "adminListing", model: Admin, schema: AdminSchema };

    router.post('/admin/addAdminUser', Globals.isAdminAuthorised(['admin_user_create']), Validators.addAdminValidator(), Validators.validate, (req, res, next) => {
        const adminObj = new UserManagementController().boot(req, res);
        return adminObj.addAdminUser();
    });

    router.post('/admin/updateUser', Globals.isAdminAuthorised(['admin_user_edit']), Validators.updateAdminUserValidator(), Validators.validate, (req, res, next) => {
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.updateUser();
    });

    router.get('/admin/userProfile/:userId', Globals.isAdminAuthorised(['admin_user_view_list']), Validators.detailValidator(), Validators.validate, (req, res, next) => {
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.userProfile();
    });

    router.post('/admin/deleteUsers', Globals.isAdminAuthorised(['admin_user_delete']), Validators.deleteValidator(), Validators.validate, (req, res, next) => {
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.deleteUsers();
    });

    router.post('/admin/changeStatus', Globals.isAdminAuthorised(['admin_user_status_update']), Validators.statusValidator({ key: 'userIds' }), Validators.validate, (req, res, next) => {
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.changeStatus();
    });

    router.post('/admin/userListing', Globals.isAdminAuthorised(['admin_user_view_list']), Validators.listingValidator(), Validators.validate, (req, res, next) => {
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.adminUserListing();
    });

    router.post('/admin/downloadAdminFile', Globals.isAdminAuthorised(['admin_user_download']), (req, res, next) => {
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.downloadAdminFile();
    });

    router.post('/admin/listOrderByUser', Globals.isAdminAuthorised(['admin_user_view_list']), (req, res, next) => {
        const userObj = (new UserManagementController()).boot(req, res);
        return userObj.listOrdersByUser();
    });

    // global.routes.push(expressListRoutes(router));
    app.use(config.baseApiUrl, router);
}