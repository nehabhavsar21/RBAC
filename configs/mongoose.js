/****************************
 MONGOOSE SCHEMAS
 ****************************/
let config = require('./configs');
let mongoose = require('mongoose');
mongoose.Promise = global.Promise;

let cachedDb = {};


module.exports = function () {

  // Mongoose connection
  // /var db = mongoose.connect(config.db);

  return new Promise(async (resolve, reject) => {
    try {
      if (cachedDb && cachedDb.isConnected) {
        console.log('***** Using existing database connection *****');
        return resolve(cachedDb.isConnected);
        //return cachedDb.isConnected;
      }
      var settings = {
        useNewUrlParser: true
        // useUnifiedTopology: true
      };
      const db = await mongoose.connect(config.db, settings);
      cachedDb.isConnected = db.connections[0].readyState;

      // return cachedDb.isConnected;
      resolve(cachedDb.isConnected);
    } catch (err) {
      console.log('Error while connecting to database --- ', err);
      return reject({ statusCode: 500, message: err });
    }
  });

  // Including model files 
};
