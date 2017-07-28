'use strict';

const Config = require('../../config');

module.exports = function (mongoose) {
  const modelName = "authAttempt";
  const Types = mongoose.Schema.Types;
  const Schema = new mongoose.Schema({
    logonid: {
      type: Types.String,
      required: true
    },
    ip: {
      type: Types.String,
      required: true
    },
    time: {
      type: Types.Date,
      required: true
    }
  }, { collection: modelName });

  Schema.statics = {
    collectionName: modelName,
    routeOptions: {
      alias: "auth-attempt"
    },
    createInstance: function (ip, logonvalue, Log) {

      const document = {
        ip,
        logonid: logonvalue.toLowerCase(),
        time: new Date()
      };

      return mongoose.model('authAttempt').create(document)
        .then(function (docs) {
          return docs;
        });
    },

    abuseDetected: function (ip, logonvalue, Log) {
      const self = this;

      const lockOutPeriod = Config.get('/lockOutPeriod');
      const expirationDate = lockOutPeriod ? { $gt: Date.now() - lockOutPeriod * 60000 } : { $lt: Date.now() };

      let abusiveIpCount = {};
      let abusiveIpUserCount = {};

      const query = {
        ip,
        time: expirationDate
      };

      return self.count(query)
        .then(function (result) {
          abusiveIpCount = result;

          const query = {
            ip,
            logonid: logonvalue.toLowerCase(),
            time: expirationDate
          };

          return self.count(query);
        })
        .then(function (result) {
          abusiveIpUserCount = result;

          const authAttemptsConfig = Config.get('/authAttempts');
          const ipLimitReached = abusiveIpCount >= authAttemptsConfig.forIp;
          const ipUserLimitReached = abusiveIpUserCount >= authAttemptsConfig.forIpAndUser;

          return (ipLimitReached || ipUserLimitReached);
        });
    }
  };

  return Schema;
};
