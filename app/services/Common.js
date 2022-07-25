/****************************
 Common services
 ****************************/
const _ = require("lodash");
const bcrypt = require('bcrypt');
const https = require('https');
const Moment = require('moment-timezone');
const i18n = require("i18n");

const Config = require('../../configs/configs');
const Users = require('../modules/User/Schema').Users;


class Common {

    /********************************************************
     Purpose:Service for error handling
     Parameter:
     {
         errObj: {},
         schema: {}
     }
     Return: JSON String
     ********************************************************/
    errorHandle(errObj, schema = null) {
        return new Promise(async (resolve, reject) => {
            try {
                let errorMessage = "";
                if (errObj && errObj.code) {
                    switch (errObj.code) {
                        case 11000:
                            errorMessage = "Duplicate key error";
                            if (schema) {
                                const indexes = [[{ _id: 1 }, { unique: true }]].concat(schema.indexes());
                                await indexes.forEach(async (index) => {
                                    const paths = Object.keys(index[0]);
                                    if ((errObj.message).includes(paths[0])) {
                                        errorMessage = ` ${paths[0]} expects to be unique. `;
                                    }
                                });
                            }
                            break;
                        case 0:
                            errorMessage = "";
                            break;
                        case 1:
                            errorMessage = "";
                            break;
                        default:
                            break;
                    }
                } else if (errObj && errObj.message && errObj.message.errmsg) {
                    errorMessage = errObj.message.errmsg;
                } else if (errObj && errObj.errors) {
                    if (schema) {
                        schema.eachPath(function (schemapath) {
                            if (_.has(errObj.errors, schemapath) && errObj.errors[schemapath].message) {
                                errorMessage = errObj.errors[schemapath].message;
                            }
                        });

                    }
                } else if (errObj && errObj.message && errObj.message.errors) {
                    if (schema) {
                        schema.eachPath(function (schemapath) {
                            // console.log('schemapath', schemapath);
                            if (_.has(errObj.message.errors, schemapath) && errObj.message.errors[schemapath].message) {
                                errorMessage = errObj.message.errors[schemapath].message;
                                // console.log('errorMessage', errorMessage);
                            }
                        });

                    }
                }
                return resolve(errorMessage);
            } catch (error) {
                return reject({ status: 0, message: error });
            }
        });
    }

    /********************************************************
     Purpose: Service for sending push notification
     Parameter:
     {
        data:{
            deviceToken:"",
            device:"",
            title:"",
            message:""
        }
     }
     Return: JSON String
     ********************************************************/
    sendPushNotification(data) {
        return new Promise(async (resolve, reject) => {
            try {
                if (data.deviceToken && data.device) {
                    // if (data.device == 'ios') {
                    //     let notificationData = {
                    //         "deviceToken": data.deviceToken,
                    //         "title": data.title ? data.title : 'Title',
                    //         "message": data.message ? data.message : "Message",
                    //         "firstName": "testname"
                    //     };
                    //     await PushNotification.send(notificationData);

                    // } else if (data.device == 'android') {
                    let notificationData = {
                        "deviceToken": data.deviceToken,
                        "title": data.title ? data.title : 'Title',
                        "message": data.message ? data.message : "Message"
                    };
                    await PushNotification.sendAndroid(notificationData);
                    // }

                }
                resolve();
            } catch (error) {
                console.log('error in send', error);
                resolve();
                // reject(error)
            }
        });

    }
    sendPushNotificationToMultipleDevice(data) {
        return new Promise(async (resolve, reject) => {
            try {
                if (data.deviceToken && data.device) {
                    let notificationData = {
                        "deviceToken": data.deviceToken,
                        "title": data.title ? data.title : 'Title',
                        "message": data.message ? data.message : "Message"
                    };
                    await PushNotification.sendPushNotificationToMultipleDevices(notificationData);
                    // }
                }
                resolve();
            } catch (error) {
                console.log('error in send', error);
                resolve();
                // reject(error)
            }
        });
    }

    /********************************************************
    Purpose: Encrypt password
    Parameter:
        {
            "data":{
                "password" : "test123"
            }
        }
    Return: JSON String
    ********************************************************/
    ecryptPassword(data) {
        return new Promise(async (resolve, reject) => {
            try {
                if (data && data.password) {
                    let password = bcrypt.hashSync(data.password, 10);
                    return resolve(password);
                }
                return resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /********************************************************
    Purpose: Compare password
    Parameter:
        {
            "data":{
                "password" : "Buffer data", // Encrypted password
                "savedPassword": "Buffer data" // Encrypted password
            }
        }
    Return: JSON String
    ********************************************************/
    verifyPassword(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let isVerified = false;
                if (data && data.password && data.savedPassword) {
                    let base64data = Buffer.from(data.savedPassword, 'binary').toString();
                    isVerified = await bcrypt.compareSync(data.password, base64data)
                }
                return resolve(isVerified);
            } catch (error) {
                reject(error);
            }
        });
    }

    /********************************************************
    Purpose: Validate password
    Parameter:
        {
            "data":{
                "password" : "test123",
                "userObj": {}
            }
        }
    Return: JSON String
    ********************************************************/
    validatePassword(data) {
        return new Promise(async (resolve, reject) => {
            try {
                if (data && data.password) {
                    if (data.userObj && _.isEqual(data.password, data.userObj.firstname)) {
                        return resolve({ status: 0, message: i18n.__("PASSWORD_NOT_SAME_FIRSTNAME") });
                    }
                    // Check new password is already used or not
                    if (Config.dontAllowPreviouslyUsedPassword && Config.dontAllowPreviouslyUsedPassword == 'true' && data.userObj && data.userObj.previouslyUsedPasswords && Array.isArray(data.userObj.previouslyUsedPasswords) && data.userObj.previouslyUsedPasswords.length) {
                        let isPreviouslyUsed = _.filter(data.userObj.previouslyUsedPasswords, (previouslyUsedPassword) => {
                            let base64data = Buffer.from(previouslyUsedPassword, 'binary').toString();
                            return bcrypt.compareSync(data.password, base64data)
                        });
                        if (isPreviouslyUsed && Array.isArray(isPreviouslyUsed) && isPreviouslyUsed.length) {
                            return resolve({ status: 0, message: i18n.__("ALREADY_USED_PASSWORD") });
                        }
                    }
                    return resolve({ status: 1, message: "Valid password." });
                } else {
                    return resolve({ status: 0, message: "Password required." });
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /********************************************************
     Purpose: Service for handling wrong password attempt
     Parameter:
     {
        data:{
            user:{},
            ip:"10.2.2.43",
            password:"test"
        }
     }
     Return: JSON String
     ********************************************************/
    handleWrongPasswordAttempt(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let user = data.user ? data.user : {};
                let ip = data.ip ? data.ip : null;
                let password = data.password ? data.password : null;
                const isPasswordCorrect = await this.verifyPassword({ password: password, savedPassword: user.password });

                if (user.failedAttempts && Array.isArray(user.failedAttempts) && user.failedAttempts) {
                    let filteredObj = _.filter(user.failedAttempts, (obj) => {
                        return _.isEqual(obj.ip, ip)
                    });

                    if (filteredObj && Array.isArray(filteredObj) && filteredObj.length && _.head(filteredObj)) {
                        filteredObj = _.head(filteredObj);
                        if (filteredObj.isBlocked) {
                            let blockedDate = Moment(filteredObj.blockedDate, 'YYYY-MM-DD HH:mm:ss');
                            let currentDate = Moment(new Date(), 'YYYY-MM-DD HH:mm:ss');
                            let duration = Moment.duration(currentDate.diff(blockedDate));
                            let minutes = duration.asMinutes();

                            if (minutes >= parseInt(Config.timeDurationOfBlockingAfterWrongAttempts)) {
                                let params = { "failedAttempts.$.isBlocked": false, "failedAttempts.$.attempts": isPasswordCorrect ? 0 : 1 };
                                await Users.findOneAndUpdate({ _id: user._id, "failedAttempts.ip": ip }, params, { new: true });
                                return !isPasswordCorrect ? resolve({ status: 0, message: i18n.__("INVALID_PASSWORD") }) : resolve();
                            } else {
                                return resolve({ status: 0, message: i18n.__("LOGIN_BLOCKED_TEMP") });
                            }

                        } else if (!isPasswordCorrect) {
                            let params = { $inc: { "failedAttempts.$.attempts": 1 } };
                            if (filteredObj.attempts >= parseInt(Config.allowedFailAttemptsOfLogin)) {
                                params = { "failedAttempts.$.isBlocked": true, "failedAttempts.$.blockedDate": new Date() };
                            }
                            await Users.findOneAndUpdate({ _id: user._id, "failedAttempts.ip": ip }, params, { new: true });
                            return resolve({ status: 0, message: i18n.__("INVALID_PASSWORD") });
                        }
                    } else if (!isPasswordCorrect) {
                        await Users.findOneAndUpdate({ _id: user._id }, { $push: { "failedAttempts": { "ip": ip, "attempts": 1 } } }, { new: true });
                        return resolve({ status: 0, message: i18n.__("INVALID_PASSWORD") });
                    }
                } else if (!isPasswordCorrect) {
                    await Users.findOneAndUpdate({ _id: user._id }, { $set: { "failedAttempts": [{ "ip": ip, "attempts": 1 }] } }, { new: true });
                    return resolve({ status: 0, message: i18n.__("INVALID_PASSWORD") });
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /********************************************************
     Purpose: Service for listing records
     Parameter:
     {
        data:{
            bodyData:{},
            model:{}
        }
     }
     Return: JSON String
     ********************************************************/
     listing(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let bodyData = data.bodyData;
                let model = data.bodyData.model;
                let adminId = data.bodyData.adminId
                let selectObj = data.selectObj ? data.selectObj : { "__v": 0 };
                let query = data.query ? data.query : {};
                let process = data.process ? data.process : '';
                let searchText = data.searchText ? data.searchText : '';
                let fieldsArray = data.fieldsArray ? data.fieldsArray : [];
                let stages = (data.stages) ? (data.stages) : '';
                if (bodyData.page && bodyData.pagesize) {
                    let skip = (bodyData.page - 1) * (bodyData.pagesize);
                    let sort = bodyData.sort ? bodyData.sort : { createdAt: -1 };
                    /**** searchText condition *****/
                    let search = (searchText != '') ? await this.searchData({ searchText, fieldsArray }) : {};
                    /******** filtered data ********/
                    let filter;
                    if (data.bodyData.columnKey == 'userListing') {
                        filter = await this.constructFilterUser({ filter: bodyData.filter, condition: (bodyData.condition) ? bodyData.condition : '$and', process, staticFilter: bodyData.staticFilter });
                    } else {
                        filter = await this.constructFilter({ filter: bodyData.filter, condition: (bodyData.condition) ? bodyData.condition : '$and', process, staticFilter: bodyData.staticFilter });
                    }
                    let listing;
                    let finalQuery = { $and: [{}], $or: [{}] };
                    let andOr = ['$and', '$or'];
                    andOr.forEach(key => {
                        if (filter[key]) {
                            finalQuery[key].push(...filter[key]);
                            delete filter[key];
                        }
                        if (search[key]) {
                            finalQuery[key].push(...search[key]);
                            delete search[key];
                        }
                        if (query[key]) {
                            finalQuery[key].push(...query[key]);
                            delete query[key];
                        }
                    });
                    finalQuery = { ...finalQuery, ...search, ...filter, ...query };
                    // finalQuery = (query != {}) ? { ...search, ...filter, ...query } : { ...filter, ...search };
                    listing = (stages == '') ?
                        await model.find(finalQuery).collation({ locale: Config.collation }).sort(sort).skip(skip).limit(bodyData.pagesize).select(selectObj) :
                        await model.aggregate([{ $match: query }, ...stages, { $match: finalQuery }, { $project: selectObj }, { $sort: sort }, { $skip: skip }, { $limit: parseInt(bodyData.pagesize) }])

                    const total = (stages == '') ? await model.find(finalQuery).countDocuments() : await model.aggregate([{ $match: query }, ...stages, { $match: finalQuery }, { $project: { _id: 1 } }])

                    const totalCount = (stages == '') ? total : total.length

                    let columnKey = data.bodyData.columnKey;
                    if (columnKey) {
                        /***** column settings *****/
                        let settings = await ColumnSettings.findOne({ adminId: adminId, key: columnKey }, { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 }
                        );
                        let columnSettings = settings && settings.columns && Array.isArray(settings.columns) ? settings.columns : [];
                        /***** providing latest columns *****/
                        let latestColumns = settings && settings.latestColumns && Array.isArray(settings.latestColumns) ? settings.latestColumns : [];
                        /****** filter settings *****/
                        let filterSettings = await FilterSettings.find({ adminId: adminId, key: columnKey }, { __v: 0, createdAt: 0, updatedAt: 0, adminId: 0, key: 0 }
                        )
                        filterSettings = (!_.isEmpty(filterSettings) && filterSettings.length > 0 && Array.isArray(filterSettings)) ? filterSettings : [];
                        let templateSettings = await TemplateSettings.find({ adminId: adminId, key: columnKey }, { __v: 0, createdAt: 0, updatedAt: 0, adminId: 0, key: 0 }
                        )
                        templateSettings = (!_.isEmpty(templateSettings) && templateSettings.length > 0 && Array.isArray(templateSettings)) ? templateSettings : [];
                        return resolve({ status: 1, data: { listing, columnSettings, filterSettings, templateSettings, latestColumns }, page: parseInt(bodyData.page), perPage: parseInt(bodyData.pagesize), total: totalCount });
                    } else {
                        return resolve({ status: 1, data: { listing }, page: parseInt(bodyData.page), perPage: parseInt(bodyData.pagesize), total: total });
                    }
                } else {
                    return resolve({ status: 0, message: "Page and pagesize required." })
                }
            } catch (error) {
                return reject(error)
            }
        });
    }
    constructFilter(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let commonFilter = { ...data.staticFilter, $or: [{ isDeleted: { $exists: false } }, { $and: [{ isDeleted: { $exists: true } }, { isDeleted: false }] }] };
                let f = [];
                let filter1 = commonFilter;
                if (data.filter && Array.isArray(data.filter)) {
                    let filter = data.filter;
                    for (let index in filter) {
                        let details = filter[index];
                        let keyValue = details.value;
                        let filterQuery;
                        if (details.type == 'contains') {
                            if (details.key == 'countryName' && (data.process == 'currency' || data.process == 'timezone')) {
                                details.key = "country.countryName"
                            }
                            let regex = { $regex: `.*${[keyValue]}.*`, $options: 'i' };
                            filterQuery = { [details.key]: regex };
                        }
                        else if (details.type == 'greaterThan') {
                            filterQuery = { [details.key]: { $gte: parseInt(keyValue) } };
                        }
                        else if (details.type == 'lessThan') {
                            filterQuery = { [details.key]: { $lte: parseInt(keyValue) } };
                        }
                        else {
                            /**** getting details  ****/
                            if (keyValue && keyValue.presentDate) {
                                /**** converting date of string values into date format ****/
                                let presentDate = new Date(keyValue.presentDate);
                                let count = (keyValue.calendarSpecificCount) ? keyValue.calendarSpecificCount : -1;
                                let calendarType = (keyValue.calendarSpecificType) ? keyValue.calendarSpecificType : 'days';
                                /***** adding 5:30 hrs to the date to get exact date from the server *****/
                                let newDate = new Date(Moment(presentDate).add(5, 'hours').add(30, 'minutes'));
                                let finalDate = new Date(Moment(newDate).add(-count, calendarType));
                                filterQuery = { [details.key]: { $gte: finalDate, $lte: newDate } };
                            } else {
                                /**** converting date of string values into date format for custom date****/
                                let startDate = new Date(keyValue.startDate);
                                let endDate = new Date(keyValue.endDate);
                                /***** adding 5:30 hrs to the date to get exact date from the server *****/
                                let fromDate = new Date(Moment(startDate).add(5, 'hours').add(30, 'minutes'));
                                let toDate = new Date(Moment(endDate).add(5, 'hours').add(30, 'minutes'));
                                if (keyValue.startDate && keyValue.endDate) {
                                    filterQuery = { [details.key]: { $gte: fromDate, $lte: toDate } }
                                } else {
                                    filterQuery = {};
                                }
                                /****** date picker is pending ******/
                            }
                        }
                        f.push(filterQuery)
                    }
                    filter1 = { $and: [{ [data.condition]: f }, commonFilter] };
                }
                resolve(filter1);
            } catch (error) {
                reject(error);
            }
        });
    }

    constructFilterUser(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let commonFilter = { $or: [{ isDeleted: { $exists: false } }, { $and: [{ isDeleted: { $exists: true } }, { isDeleted: false }] }] };
                let filter1 = commonFilter;
                if (data.filter && Array.isArray(data.filter)) {
                    let filter = data.filter;

                    let filterQueryObj;
                    for (let index in filter) {
                        let details = filter[index];
                        let keyValue = details.value;
                        let filterQuery;
                        // if (index > 0) {
                        //     filterQueryObj = { [filter[index - 1].condition]: [] };
                        // } else {
                        //     filterQueryObj = { [filter[index].condition]: [] }
                        // }
                        if (details.type == 'contains') {
                            if (details.key == 'countryName' && (data.process == 'currency' || data.process == 'timezone')) {
                                details.key = "country.countryName"
                            }
                            let regex = { $regex: `.*${[keyValue]}.*`, $options: 'i' };

                            // filterQuery = { [details.key]: regex };
                            filterQuery = { [details.key]: regex };
                        }
                        else if (details.type == 'greaterThan') {
                            filterQuery = { [details.key]: { $gte: parseInt(keyValue) } };
                        }
                        else if (details.type == 'lessThan') {
                            filterQuery = { [details.key]: { $lte: parseInt(keyValue) } };
                        }
                        else {
                            /**** getting details  ****/
                            if (keyValue.presentDate) {
                                /**** converting date of string values into date format ****/
                                let presentDate = new Date(keyValue.presentDate);
                                let count = (keyValue.calendarSpecificCount) ? keyValue.calendarSpecificCount : -1;
                                let calendarType = (keyValue.calendarSpecificType) ? keyValue.calendarSpecificType : 'days';
                                /***** adding 5:30 hrs to the date to get exact date from the server *****/
                                let newDate = new Date(Moment(presentDate).add(5, 'hours').add(30, 'minutes'));
                                let finalDate = new Date(Moment(newDate).add(-count, calendarType));
                                filterQuery = { [details.key]: { $gte: finalDate, $lte: newDate } };
                            } else {
                                /**** converting date of string values into date format for custom date****/
                                let startDate = new Date(keyValue.startDate);
                                let endDate = new Date(keyValue.endDate);
                                /***** adding 5:30 hrs to the date to get exact date from the server *****/
                                let fromDate = new Date(Moment(startDate).add(5, 'hours').add(30, 'minutes'));
                                let toDate = new Date(Moment(endDate).add(5, 'hours').add(30, 'minutes'));
                                if (keyValue.startDate && keyValue.endDate) {
                                    filterQuery = { [details.key]: { $gte: fromDate, $lte: toDate } }
                                } else {
                                    filterQuery = { [details.key]: details.value };
                                }
                                /****** date picker is pending ******/
                            }
                        }
                        // f.push(filterQuery)
                        if (index > 0) {
                            filterQueryObj[filter[index - 1].condition].push(filterQuery);
                            filterQueryObj = { [filter[index].condition]: [filterQueryObj] };
                        } else {
                            filter[index].condition = filter[index].condition ? filter[index].condition : '$and';
                            filterQueryObj = { [filter[index].condition]: [] };
                            filterQueryObj[filter[index].condition].push(filterQuery);
                        }
                    }
                    // console.log(filterQueryObj['$or'][0]['$and'], "+++")
                    filter1 = { $and: [filterQueryObj, commonFilter] };
                }
                return resolve(filter1);
            } catch (error) {
                return reject(error);
            }
        });
    }
    async asyncFor(array, callback) {
        // console.log(array)
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }
}

module.exports = Common;