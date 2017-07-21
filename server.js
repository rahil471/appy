'use strict';

const RestHapi = require('rest-hapi');
const Composer = require('./index');
const Labbable = require('labbable');

const labbable = module.exports = new Labbable();

Composer((err, server) => {

  if (err) {
    throw err;
  }

  labbable.using(server);
  server.start(() => {
    RestHapi.logUtil.logActionComplete(RestHapi.logger, "Server Initialized", server.info);
  });
});
