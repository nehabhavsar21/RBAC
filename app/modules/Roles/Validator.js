/****************************
 Validators
 ****************************/
const _ = require("lodash");
let i18n = require("i18n");
const { validationResult } = require('express-validator');
const { body, check, query, header, param } = require('express-validator');

class Validators {

    /********************************************************
     Purpose:Function for category validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static categoryValidator() {
        try {
            return [
                check('category').exists().withMessage(i18n.__("%s REQUIRED", 'Category'))
            ];
        } catch (error) {
            return error;
        }
    }
    /********************************************************
     Purpose:Function for permission validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static permissionValidator() {
        try {
            return [
                check('categoryId').isAlphanumeric().withMessage(i18n.__("%s VALID", 'categoryId')),
                check('permission').exists().withMessage(i18n.__("%s REQUIRED", 'Permission'))
            ];
        } catch (error) {
            return error;
        }
    }
    /********************************************************
     Purpose:Function for email settings validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static roleValidator() {
        try {
            return [
                check('permissions').isArray().withMessage(i18n.__("%s ARRAY", 'Permissions')),
                check('role').exists().withMessage(i18n.__("%s REQUIRED", 'Role'))
            ];
        } catch (error) {
            return error;
        }
    }/********************************************************
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
    static detailValidator() {
        try {
            return [
                param('roleId').exists().withMessage(i18n.__("%s REQUIRED", 'Role Id')),
                param('roleId').not().equals('undefined').withMessage(i18n.__("%s REQUIRED", 'Valid ' + 'Role Id')),
                param('roleId').not().equals('null').withMessage(i18n.__("%s REQUIRED", 'Valid ' + 'Role Id')),
                param('roleId').isAlphanumeric().withMessage(i18n.__("%s REQUIRED", 'Valid ' + 'Role Id')),
                param('roleId').not().isEmpty().withMessage(i18n.__("%s REQUIRED", 'Valid ' + 'Role Id'))
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
                check('ids').isArray().withMessage(i18n.__("%s ARRAY", 'Role ids')),
                check('ids').isLength({ min: 1 }).withMessage(i18n.__("%s ARRAY_LENGTH", 'Role ids')),
                check('status').isBoolean().withMessage(i18n.__("%s REQUIRED", 'Status'))
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
                check('ids').isArray().withMessage(i18n.__("%s ARRAY", 'Role ids')),
                check('ids').isLength({ min: 1 }).withMessage(i18n.__("%s ARRAY_LENGTH", 'Role ids'))
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