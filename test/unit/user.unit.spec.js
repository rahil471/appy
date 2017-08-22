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

//let userschema = require('../../server/models/user.model')(mongoose);
//const User = mongoose.model('user',userschema);

//const usertests = require('./unit.spec');
describe('Unit Tests - User', ()=>{
    let server;
    let User;
    before((done)=>{
        LabbableServer.ready((err, s)=>{
            if(err) {
                return done(err);
            }
            server = s;
            User = mongoose.model('user');
            done();
        });
    });
        // server is now available to be tested
    it('initializes.', (done) => {
        expect(server).to.exist();
        expect(LabbableServer.isInitialized()).to.equal(true);
        done();
    });

    it("should find users by credentials", (done)=>{
        let email = "manager@gmail.com";
        User.findByCredentials(email, "root").then((result)=>{
            expect(result.email).to.be.equal(email)
            done();
        });
    });

    it("should hash a password", (done)=>{
        User.generatePasswordHash('rahil').then((result)=>{
            expect(result.password).to.equal('rahil');
            expect(result.hash).to.be.a.string();
            expect(result.hash).to.be.length(60);
            done();
        });
    });
});
