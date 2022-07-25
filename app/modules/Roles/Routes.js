module.exports = (app, express) => {

    const router = express.Router();

    const Globals = require("../../../configs/Globals");
    const Controller = require('./Controller');
    const config = require('../../../configs/configs');
    const Validators = require("./Validator");
    const expressListRoutes = require('../../services/Routes');

    router.post('/addPermissionCategory', Globals.isAdminAuthorised(['roles_create', 'roles_edit']), Validators.categoryValidator(), Validators.validate, (req, res, next) => {
        const obj = (new Controller()).boot(req, res);
        return obj.addPermissionCategory();
    });

    router.get('/getCategory', Globals.isAdminAuthorised(['roles_view_list']), (req, res, next) => {
        const obj = (new Controller()).boot(req, res);
        return obj.getCategory();
    });

    router.post('/addPermissions', Globals.isAdminAuthorised(['roles_create', 'roles_edit']), Validators.permissionValidator(), Validators.validate, (req, res, next) => {
        const obj = (new Controller()).boot(req, res);
        return obj.addPermissions();
    });

    router.get('/getAllPermission', Globals.isAdminAuthorised(['roles_view_list']), (req, res, next) => {
        const obj = (new Controller()).boot(req, res);
        return obj.getAllPermission();
    });

    router.post('/addRole', Globals.isAdminAuthorised(['roles_create', 'roles_edit']), Validators.roleValidator(), Validators.validate, (req, res, next) => {
        const obj = (new Controller()).boot(req, res);
        return obj.addRole();
    });

    router.post('/listRole', Globals.isAdminAuthorised(['roles_view_list']), Validators.listingValidator(), Validators.validate, (req, res, next) => {
        const obj = (new Controller()).boot(req, res);
        return obj.listRoles();
    });

    router.get('/getRolePermission/:roleId', Globals.isAdminAuthorised(['roles_view_list']), Validators.detailValidator(), Validators.validate, (req, res, next) => {
        const obj = (new Controller()).boot(req, res);
        return obj.getRolePermission();
    });

    router.post('/changeRoleStatus', Globals.isAdminAuthorised(['roles_status_update']), Validators.statusValidator(), Validators.validate, (req, res, next) => {
        const obj = (new Controller()).boot(req, res);
        return obj.changeStatus();
    });
    // router.post('/deleteRoles', Globals.isAdminAuthorised(), Validators.deleteValidator(), Validators.validate, (req, res, next) => {
    //     const obj = (new Controller()).boot(req, res);
    //     return obj.deleteRole();
    // });
    
    global.routes.push(expressListRoutes(router));
    app.use(config.baseApiUrl, router);
}