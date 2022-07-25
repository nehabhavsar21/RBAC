module.exports = (app, express) => {

    const router = express.Router();

    const Globals = require("../../../configs/Globals");
    const EmailController = require('./Controller');
    const config = require('../../../configs/configs');
    const Validators = require("./Validator");
    const expressListRoutes = require('../../services/Routes');

    router.post('/addUpdateEmail', Globals.setLocalLanguage, Globals.isAdminAuthorised(['email_template_edit', 'email_template_create']), Validators.templateValidator(), Validators.validate, (req, res, next) => {
        const emjObj = (new EmailController()).boot(req, res);
        return emjObj.addUpdateEmail();
    });

    router.post('/deleteTemplate', Globals.setLocalLanguage, Globals.isAdminAuthorised(['email_template_delete']), Validators.deleteValidator(), Validators.validate, (req, res, next) => {
        const emjObj = (new EmailController()).boot(req, res);
        return emjObj.deleteEmail();
    });
    router.post('/changeTemplateStatus', Globals.setLocalLanguage, Globals.isAdminAuthorised(['email_template_status_update']), Validators.statusValidator(), Validators.validate, (req, res, next) => {
        const emjObj = (new EmailController()).boot(req, res);
        return emjObj.changeStatus();
    });

    router.get('/detailEmail/:id', Globals.setLocalLanguage, Globals.isAdminAuthorised(['email_template_view_list']), Validators.detailValidator(), Validators.validate, (req, res, next) => {
        const emjObj = (new EmailController()).boot(req, res);
        return emjObj.detailEmail();
    });

    router.post('/listEmail', Globals.setLocalLanguage, Globals.isAdminAuthorised(['email_template_view_list']), Validators.listingValidator(), Validators.validate, (req, res, next) => {
        const emjObj = (new EmailController()).boot(req, res);
        return emjObj.listEmail();
    });

    global.routes.push(expressListRoutes(router));
    app.use(config.baseApiUrl, router);
}