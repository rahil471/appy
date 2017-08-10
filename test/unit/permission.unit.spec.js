'use strict';

const RestHapi = require('rest-hapi');
const LabbableServer = require('../../server.js');
const mongoose = require('mongoose');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
// use some BDD verbage instead of lab default
const describe = lab.describe;
const it = lab.it;
const after = lab.after;
const beforeEach = lab.beforeEach;
const before = lab.before;

const Code = require('code');
const expect = Code.expect;

//let userschema = require('../../server/models/user.model')(mongoose);
//const User = mongoose.model('user',userschema);

//const usertests = require('./unit.spec');
describe('Functional Tests - Permission', () => {
    let server;
    let Permission;
    let User;
    let OneUser;
    let email = "user@gmail.com";
    before((done) => {
        LabbableServer.ready((err, s) => {
            if (err) {
                return done(err);
            }
            server = s;
            Permission = mongoose.model('permission');
            User = mongoose.model('user');
            User.findByCredentials(email, "root").then((result) => {
                OneUser = result;
                done();
            });
        });
    });
    // server is now available to be tested
    it('initializes.', (done) => {
        expect(server).to.exist();
        expect(LabbableServer.isInitialized()).to.equal(true);
        done();
    });

    it('user exists', (done) => {
        expect(OneUser.email).to.be.equal(email);
        done();
    });

    it("should return normalized permission array", (done) => {
        let user = {
            _id: OneUser._id //admin
        };
        Permission.getEffectivePermissions(user, RestHapi.logger).then((result) => {
            expect(result).to.be.an.array();
            done();
        }).catch((e) => {
            expect(false).to.be.equal(true);
            done();
        });
    });

    it("should return scopes for a given user", (done) => {
        let user = {
            _id: OneUser._id //admin
        };
        Permission.getScope(user, RestHapi.logger).then((result) => {
            expect(result).to.be.an.array();
            expect(result.length).to.be.greaterThan(0);
            done();
        }).catch((e) => {
            expect(false).to.be.equal(true);
            done();
        });
    });
});