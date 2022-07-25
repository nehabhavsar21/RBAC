/****************************
 Validators
 ****************************/
const _ = require("lodash");
let i18n = require("i18n");
const { validationResult, check } = require('express-validator');

let commonlyUsedPasswords = require('../../../configs/commonlyUsedPassword').passwords;

class Validators {


    /********************************************************
    Purpose: Social Access validator
    Parameter: {}
    Return: JSON String
    ********************************************************/
    static socialAccessValidator() {
        try {
            return [
                check('socialId').exists().withMessage(i18n.__("%s REQUIRED", 'socialId')),
                check('socialKey').exists().withMessage(i18n.__("%s REQUIRED", 'socialKey')),
            ];
        } catch (error) {
            return error;
        }
    }


    /********************************************************
     Purpose:Function for login validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static loginValidator() {
        try {
            return [
                // ...this.emailValidator(),
                ...this.passwordValidator({ key: 'password' })
            ];
        } catch (error) {
            throw new Error(error);
        }
    }
    /********************************************************
     Purpose:Function for reset password validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static resetPasswordValidator() {
        try {
            return [
                check('token').exists().withMessage(i18n.__("%s REQUIRED", 'Token')),
                ...this.passwordValidator({ key: 'password' })
            ];
        } catch (error) {
            return error;
        }
    }
    /********************************************************
     Purpose:Function for password validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static passwordValidator(keyObj = { key: 'password' }) {
        try {
            return [
                check(keyObj.key)
                    .not().isIn(commonlyUsedPasswords).withMessage(i18n.__("COMMONLY_USED_PASSWORD"))
                    // .isLength({ min: 8 }).withMessage(i18n.__("PASSWORD_VALIDATION_LENGTH"))
                    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d].*/).withMessage(i18n.__("PASSWORD_VALIDATION"))
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
     Purpose: Function for change password validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static changePasswordValidator() {
        try {
            return [
                check('oldPassword').exists().withMessage(i18n.__("%s REQUIRED", 'Current password')),
                ...this.passwordValidator({ key: 'newPassword' })
            ];
        } catch (error) {
            return error;
        }
    }
    /********************************************************
     Purpose:Function for update user validator
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    static updateAdminValidator() {
        try {
            return [
                check('firstname').exists().withMessage(i18n.__("%s REQUIRED", 'Firstname')),
                check('lastname').exists().withMessage(i18n.__("%s REQUIRED", 'Lastname')),
                // check('mobile').exists().withMessage(i18n.__("%s REQUIRED", 'username'))
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