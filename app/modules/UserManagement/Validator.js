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
      Purpose:Function for addUserByAdmin validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static addUserByAdmin() {
        try {
            return [
                // check('firstName').exists().withMessage(i18n.__("%s REQUIRED", 'firstName')),
                // check('lastName').exists().withMessage(i18n.__("%s REQUIRED", 'lastName')),
                // check('userName').exists().withMessage(i18n.__("%s REQUIRED", 'userName')),
                check('emailId').exists().isEmail().withMessage(i18n.__("%s REQUIRED", 'emailId')),
                check('role').exists().withMessage(i18n.__("%s REQUIRED", 'role'))
                // check('status').exists().withMessage(i18n.__("%s REQUIRED", 'status')),
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
     Purpose: Function for key validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static keyValidator() {
        try {
            return [
                check('key').exists().withMessage(i18n.__("%s REQUIRED", 'key'))
            ];
        } catch (error) {
            return error;
        }
    }

    /********************************************************
     Purpose: Function for templateId validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static templateIdValidator() {
        try {
            return [
                check('templateId').exists().withMessage(i18n.__("%s REQUIRED", 'templateId')),
            ];
        } catch (error) {
            return error;
        }
    }

    /********************************************************
    Purpose: Function for filterId validator
    Parameter:
    {}
    Return: JSON String
    ********************************************************/
    static filterIdValidator() {
        try {
            return [
                check('filterId').exists().withMessage(i18n.__("%s REQUIRED", 'filterId')),
            ];
        } catch (error) {
            return error;
        }
    }


    /********************************************************
     Purpose: Function for listing validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static saveColumnValidator() {
        try {
            return [
                ...this.keyValidator(),
                check('columns').isArray().withMessage(i18n.__("%s ARRAY", 'Columns')),
                check('columns').isLength({ min: 1 }).withMessage(i18n.__("%s ARRAY_LENGTH", 'Columns'))
            ];
        } catch (error) {
            return error;
        }
    }

    /********************************************************
    Purpose: Function for template validator
    Parameter:
    {}
    Return: JSON String
    ********************************************************/
    static saveTemplateValidator() {
        try {
            return [
                check('description').exists().withMessage(i18n.__("%s REQUIRED", 'description')),
                check('color').exists().withMessage(i18n.__("%s REQUIRED", 'color')),
                ...this.saveColumnValidator()
            ];
        } catch (error) {
            return error;
        }
    }


    /********************************************************
     Purpose:Function for save filter validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static saveFilterValidator() {
        try {
            return [
                check('condition').exists().withMessage(i18n.__("%s REQUIRED", 'condition')),
                check('key').exists().withMessage(i18n.__("%s REQUIRED", 'key')),
                check('description').exists().withMessage(i18n.__("%s REQUIRED", 'description')),
                check('color').exists().withMessage(i18n.__("%s REQUIRED", 'color')),
                check('filter').isArray().withMessage(i18n.__("%s ARRAY", 'Filter')),
                check('filter').isLength({ min: 1 }).withMessage(i18n.__("%s ARRAY_LENGTH", 'Filter'))
            ];
        } catch (error) {
            return error;
        }
    }

    /********************************************************
    Purpose:Function for fields validator
    Parameter:
    {}
    Return: JSON String
    ********************************************************/
    static fieldsValidator() {
        try {
            return [
                check('filter').exists().withMessage(i18n.__("%s REQUIRED", 'filter'))
            ];
        } catch (error) {
            return error;
        }
    }

    /********************************************************
     Purpose:Function for download validator
    Parameter:
    {}
    Return: JSON String
    ********************************************************/
    static downloadValidator() {
        try {
            return [
                check('type').exists().withMessage(i18n.__("%s REQUIRED", 'type')),
                check('filteredFields').exists().withMessage(i18n.__("%s REQUIRED", 'filteredFields')),
                check('filteredFields').isArray().withMessage(i18n.__("%s ARRAY", 'filteredFields'))
            ];
        } catch (error) {
            return error;
        }
    }
    static approveUserValidator() {
        try {
            return [
                param('userId').isString().withMessage(i18n.__("%s REQUIRED", 'User Id')).trim()
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