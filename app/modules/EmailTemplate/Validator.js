/****************************
 Validators
 ****************************/
const _ = require("lodash");
let i18n = require("i18n");
const { validationResult } = require('express-validator');
const { body, check, query, header, param } = require('express-validator');

class Validators {

    /********************************************************
     Purpose:Function for email template validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static templateValidator() {
        try {
            return [
                check('emailKey').exists().withMessage(i18n.__("%s REQUIRED", 'Email key')),
                check('subject').exists().withMessage(i18n.__("%s REQUIRED", 'Subject')),
                check('emailContent').exists().withMessage(i18n.__("%s REQUIRED", 'Email content'))
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
                param('id').exists().withMessage(i18n.__("%s REQUIRED", 'Template Id')),
                param('id').not().equals('undefined').withMessage(i18n.__("%s REQUIRED", 'Valid ' + 'Template Id')),
                param('id').not().equals('null').withMessage(i18n.__("%s REQUIRED", 'Valid ' + 'Template Id')),
                param('id').isAlphanumeric().withMessage(i18n.__("%s REQUIRED", 'Valid ' + 'Template Id')),
                param('id').not().isEmpty().withMessage(i18n.__("%s REQUIRED", 'Valid ' + 'Template Id'))
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
                check('ids').isArray().withMessage(i18n.__("%s ARRAY", 'Template ids')),
                check('ids').isLength({ min: 1 }).withMessage(i18n.__("%s ARRAY_LENGTH", 'Template ids'))
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
                check('ids').isArray().withMessage(i18n.__("%s ARRAY", 'Template ids')),
                check('ids').isLength({ min: 1 }).withMessage(i18n.__("%s ARRAY_LENGTH", 'Template ids')),
                check('status').isBoolean().withMessage(i18n.__("%s REQUIRED", 'Status'))
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