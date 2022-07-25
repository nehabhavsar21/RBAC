/****************************
 Validators
 ****************************/
const _ = require("lodash");
let i18n = require("i18n");
const { validationResult } = require('express-validator');
const { body, check, query, header, param } = require('express-validator');

class Validators {


    /********************************************************
     Purpose: Function for listing validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static listingValidator() {
        try {
            return [
                check('page').isNumeric().withMessage(i18n.__("%s REQUIRED", 'Page')),
                check('pagesize').isNumeric().withMessage(i18n.__("%s REQUIRED", 'Pagesize'))
            ];
        } catch (error) {
            return error;
        }
    }

    /********************************************************
     Purpose: Function for detail validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static detailValidator(params = { "key": "userId" }) {
        try {
            return [
                param(params.key).exists().withMessage(i18n.__("%s REQUIRED", params.key)),
                param(params.key).not().equals('undefined').withMessage(i18n.__("%s REQUIRED", 'Valid ' + params.key)),
                param(params.key).not().equals('null').withMessage(i18n.__("%s REQUIRED", 'Valid ' + params.key)),
                param(params.key).isAlphanumeric().withMessage(i18n.__("%s REQUIRED", 'Valid ' + params.key)),
                param(params.key).not().isEmpty().withMessage(i18n.__("%s REQUIRED", 'Valid ' + params.key))
            ];
        } catch (error) {
            return error;
        }
    }

    /********************************************************
     Purpose:Function for delete validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static deleteValidator() {
        try {
            return [
                check('userIds').isArray().withMessage(i18n.__("%s ARRAY", 'User ids')),
                check('userIds').isLength({ min: 1 }).withMessage(i18n.__("%s ARRAY_LENGTH", 'User ids'))
            ];
        } catch (error) {
            return error;
        }
    }

    /********************************************************
     Purpose:Function for status validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static statusValidator() {
        try {
            return [
                check('userIds').isArray().withMessage(i18n.__("%s ARRAY", 'User ids')),
                check('userIds').isLength({ min: 1 }).withMessage(i18n.__("%s ARRAY_LENGTH", 'User ids')),
                check('status').isBoolean().withMessage(i18n.__("%s REQUIRED", 'Status'))
            ];
        } catch (error) {
            return error;
        }
    }

    /********************************************************
     Purpose:Function for email validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static emailValidator() {
        try {
            return [check('emailId').isEmail().withMessage(i18n.__("VALID_EMAIL"))];
        } catch (error) {
            return error;
        }
    }

    /********************************************************
   Purpose:Function for add admin validator
   Parameter:
   {}
   Return: JSON String
   ********************************************************/
    static addAdminValidator() {
        try {
            return [
                ...this.emailValidator(),
                ...this.basicInfoValidator(),
                check('role').exists().withMessage(i18n.__("%s REQUIRED", 'Role')),
            ];
        } catch (error) {
            return error;
        }
    }

    /********************************************************
    Purpose:Function for add admin validator
    Parameter:
    {}
    Return: JSON String
    ********************************************************/
    static updateAdminUserValidator() {
        try {
            return [
                ...this.basicInfoValidator(),
                check('role').exists().withMessage(i18n.__("%s REQUIRED", 'Role')),
                check('userId').exists().withMessage(i18n.__("%s REQUIRED", 'userId')),
            ];
        } catch (error) {
            return error;
        }
    }

    /********************************************************
     Purpose:Function for basic info validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static basicInfoValidator() {
        try {
            return [
                check('firstname').exists().withMessage(i18n.__("%s REQUIRED", 'Firstname')),
                check('lastname').exists().withMessage(i18n.__("%s REQUIRED", 'Lastname')),
                check('mobile').exists().withMessage(i18n.__("%s REQUIRED", 'Mobile'))
            ];
        } catch (error) {
            return error;
        }
    }

    static validate(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ status: 0, message: errors.array() });
            }
            next();
        } catch (error) {
            return res.send({ status: 0, message: error });
        }
    }
}

module.exports = Validators;