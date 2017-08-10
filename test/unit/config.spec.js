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
const Config = require('../../config');
describe('Config Methods', ()=>{
    
    it('should return correct property value', (done)=>{
       let loglevel = Config.get('/restHapiConfig/loglevel');
       if(process.env.NODE_ENV === 'local'){
            expect(loglevel).to.equal('DEBUG');
       } else {
            expect(loglevel).to.equal('ERROR');
       }
       done();
    });

    it('should return correct metadata', (done)=>{
        let meta = Config.meta('/');
        expect(meta).to.equal("This file configures the appy API.");
        done();
    });
});
