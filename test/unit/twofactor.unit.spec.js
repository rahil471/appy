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

const Twofactor = require('../../server/utils/twofactor');
const speakeasy = require('speakeasy');

//let userschema = require('../../server/models/user.model')(mongoose);
//const User = mongoose.model('user',userschema);

//const usertests = require('./unit.spec');
describe('Unit Tests - Twofactor', ()=>{
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

    it("should verify otp - standard", (done)=>{
        let otp = 1234;
        let strategy = 'standard';
        let user = {
            twofactor: {
                strategy: 'standard',
                standard: {
                    otp: 1234,
                    otpExp: Date.now() + (30 * 60 * 1000)
                }
            }
        }

        let verified = Twofactor.verifyOtp(user, strategy, otp, RestHapi.logger);
        expect(verified).to.be.equal(true);

        otp = 12445;
        let verified1 = Twofactor.verifyOtp(user, strategy, otp, RestHapi.logger);
        expect(verified1).to.be.equal(false);

        otp = 1234;
        user.twofactor.standard.otpExp = Date.now() - (30);
        let verified2 = Twofactor.verifyOtp(user, strategy, otp, RestHapi.logger);
        expect(verified2).to.be.equal(false);

        done();
    });


    it("should verify otp - totp", (done)=>{
        let strategy = 'totp';
        let user = {
            twofactor: {
                strategy: 'totp',
                totp: {
                    "secret" : "FQQVCW3PLBNWGZ26"
                }
            }
        }
        let otp1 = speakeasy.totp({
            secret: user.twofactor.totp.secret,
            encoding: 'base32',
            time: new Date().getTime() / 1000
        });

        let verified = Twofactor.verifyOtp(user, strategy, otp1, RestHapi.logger);
        expect(verified).to.be.equal(true);

        let otp2 = speakeasy.totp({
            secret: user.twofactor.totp.secret,
            encoding: 'base32',
            time: (new Date().getTime() / 1000) - (3600) 
        });
        let verified1 = Twofactor.verifyOtp(user, strategy, otp2, RestHapi.logger);
        expect(verified1).to.be.equal(false);

        done();
    });
});
