'use strict';

const RestHapi = require('rest-hapi');
const LabbableServer = require('../../server.js');
const mongoose = require('mongoose');
const Lab = require('lab');
const lab         = exports.lab = Lab.script();
// use some BDD verbage instead of lab default
const describe    = lab.describe;
const it          = lab.it;
const after       = lab.after;
const beforeEach = lab.beforeEach;
const before = lab.before;

const Code = require('code');
const expect      = Code.expect;
const createToken = require('../../server/token');

//let userschema = require('../../server/models/user.model')(mongoose);
//const User = mongoose.model('user',userschema);

//const usertests = require('./unit.spec');
describe('Token operations', ()=>{
    // let server;
    // let Permission;
    // before((done)=>{
    //     LabbableServer.ready((err, s)=>{
    //         if(err) {
    //             return done(err);
    //         }
    //         server = s;
    //         Permission = mongoose.model('permission');
    //         done();
    //     });
    // });
    
    it('should return a valid token', (done)=>{
        let user = {
            firstName: "Rahil",
            lastName: "Shaikh",
            email: "rahil@gmail.com",
            role: "admin",
            createdAt: "12-02-92",
            updatedAt: "13-05-07"
        };
        let scope = ["root"];
        let expiration = "10";
        let token = createToken(user, null, scope, expiration, RestHapi.logger);
        expect(token).to.be.a.string();
        done();
    });
});
