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
describe('Unit Tests - Permission', ()=>{
    let server;
    let Permission;
    before((done)=>{
        LabbableServer.ready((err, s)=>{
            if(err) {
                return done(err);
            }
            server = s;
            Permission = mongoose.model('permission');
            done();
        });
    });
        // server is now available to be tested
    it('initializes.', (done) => {
        expect(server).to.exist();
        expect(LabbableServer.isInitialized()).to.equal(true);
        done();
    });

    it("should return normalized permission array", (done)=>{
        let user = {
            _id: "596de125f8b3ee25e83aa324" //admin
        };
        Permission.getEffectivePermissions(user, RestHapi.logger).then((result)=>{
            expect(result).to.be.an.array();
            done();
        }).catch((e)=>{
            expect(false).to.be.equal(true);
            done();
        });
    });

    it("should return scopes for a given user", (done)=>{
        let user = {
            _id: "596de125f8b3ee25e83aa324" //admin
        };
        Permission.getScope(user, RestHapi.logger).then((result)=>{
            expect(result).to.be.an.array();
            expect(result.length).to.be.greaterThan(0);
            done();
        }).catch((e)=>{
            expect(false).to.be.equal(true);
            done();
        });
    });
});
