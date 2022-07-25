/****************************
 Storage Factory
 ****************************/
const _ = require("lodash");
const config = require('../../configs/configs');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const Sequelize = require('sequelize');
const db = {};
const cachedDb = {};

class Storage {
    init(){
        this.connect();
        return `${this.method} Database Connected.`;
    }
}

class MongoDb extends Storage{
    constructor(data) {
     super()
     this.method = "MongoDb";
     this.connect = () =>{
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
     }
     this.insert = () => {
      // Insert query of mongodb
     }
     this.findOne = () => {}
     this.find = () => {}
     this.init();
    }
}

class MysqlDb extends Storage{
    constructor(data) {
     super()
     this.method = "MysqlDb";
     this.connect = ()=>{
        const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
            dialect: 'mysql',
        });
        
        db.Sequelize = Sequelize;
        db.sequelize = sequelize;        
     }
     this.insert = () => {
      // Insert query of mysql
     }
     this.findOne = () => {}
     this.find = () => {}
     this.init();
    }
}

class StorageFactory {

    connectDb(data) {
     if(data.method == 'MongoDb') return new MongoDb(data)
     if(data.method == 'MysqlDb') return new MysqlDb(data);
    }
}
module.exports = StorageFactory;