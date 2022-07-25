module.exports = (app, express) => {

    const router = express.Router();
    const rateLimit = require("express-rate-limit");

    const Globals = require("../../../configs/Globals");
    const Validators = require("./Validator");
    const AdminController = require('./Controller');
    const config = require('../../../configs/configs');
    const expressListRoutes = require('../../services/Routes');

    const apiRequestLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minute window
        max: 50, // start blocking after 50 requests
        message: { status: 0, message: "Too many requests from this IP for this api, please try again after an hour" }
    });

    router.post('/admin/forgotPassword', Globals.setLocalLanguage, Validators.emailValidator(), Validators.validate, (req, res, next) => {
        const adminObj = (new AdminController()).boot(req, res);
        return adminObj.adminForgotPasswordMail();
    });
    router.post('/admin/resetPassword', Globals.setLocalLanguage, Validators.resetPasswordValidator(), Validators.validate, (req, res, next) => {
        const adminObj = (new AdminController()).boot(req, res);
        return adminObj.resetPasswordAdmin();
    });

    // router.post('/admin/login', Globals.setLocalLanguage, Validators.loginValidator(), Validators.validate, (req, res, next) => {
    //     const adminObj = new AdminController().boot(req, res);
    //     return adminObj.adminLogin();
    // });
    router.post('/admin/login', Globals.setLocalLanguage, Validators.validate, (req, res, next) => {
        const adminObj = new AdminController().boot(req, res);
        return adminObj.adminLogin();
    });

    router.get('/admin/profile', Globals.setLocalLanguage, Globals.isAdminAuthorised(), apiRequestLimiter, (req, res, next) => {
        const adminObj = new AdminController().boot(req, res);
        return adminObj.profile();
    });

    router.post('/admin/editProfile', Globals.setLocalLanguage, Globals.isAdminAuthorised(), Validators.updateAdminValidator(), Validators.validate, (req, res, next) => {
        const adminObj = new AdminController().boot(req, res);
        return adminObj.editProfile();
    });

    router.post('/admin/changePassword', Globals.setLocalLanguage, Globals.isAdminAuthorised(), Validators.changePasswordValidator(), Validators.validate, (req, res, next) => {
        const adminObj = new AdminController().boot(req, res);
        return adminObj.changePassword();
    });
    router.get('/admin/logout', Globals.setLocalLanguage, Globals.isAdminAuthorised(), (req, res, next) => {
        const adminObj = (new AdminController()).boot(req, res);
        return adminObj.logout();
    });

    router.post('/admin/fileUpload', Globals.setLocalLanguage, (req, res, next) => {
        const adminObj = new AdminController().boot(req, res);
        return adminObj.fileUpload();
    });

    router.get('/admin/getMetaText', Globals.setLocalLanguage, Globals.isAdminAuthorised(), (req, res, next) => {
        const adminObj = new AdminController().boot(req, res);
        return adminObj.getMetaText();
    });
    router.get('/admin/getAllEndpoints', Globals.setLocalLanguage, Globals.isAdminAuthorised(), (req, res, next) => {
        const adminObj = new AdminController().boot(req, res);
        return adminObj.getAllEndpoints();
    });

    // global.routes.push(expressListRoutes(router));
    app.use(config.baseApiUrl, router);
}