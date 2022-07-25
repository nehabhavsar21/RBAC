let ErrorHandler = require('../lib/ErrorHandler');
let ResponseHandler = require('../lib/ResponseHandler');
let CommonService = require('../app/services/Common');
let Error = new ErrorHandler();
let Response = new ResponseHandler();
let ErrorHandle = new CommonService();
let ResponseEn = require('../app/locales/en.json')
let ObjectId = require('mongodb').ObjectID;

module.exports = {
  Error,
  ErrorHandle,
  Response,
  ResponseEn,
  ObjectId,
};