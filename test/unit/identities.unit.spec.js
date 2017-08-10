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
describe('Functional Tests - Identities |', () => {
    let server;
    let User;
    let useroperations;
    let UserOperations;

    before((done) => {
        LabbableServer.ready((err, s) => {
            if (err) {
                return done(err);
            }
            server = s;
            UserOperations = require('../../server/utils/user');
            useroperations = new UserOperations();
            done();
        });
    });
    // server is now available to be tested
    it('initialize', (done) => {
        expect(server).to.exist();
        expect(LabbableServer.isInitialized()).to.equal(true);
        done();
    });

    it("should find social login app credentials!", (done) => {
        let provider = "google";
        useroperations.getSocialLoginAppCredentials(provider).then((result) => {
            console.log(result);
            expect(result).to.be.an.object();
            if (Object.keys(result).length) {
                expect(result.name).to.be.equal(provider);
            } else {
                expect(result).to.equal({});
            }
            done();
        }).catch((err) => {
            expect(false).to.be.equal(true);
            done();
        });
    });
});