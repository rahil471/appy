'use strict';

const RestHapi = require('rest-hapi');
const Composer = require('../../index');
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

describe('Functional Tests - User', ()=>{
    let server;
    before((done)=>{
        Composer((err, s)=>{
            if(err) {
                return done(err);
            }
            server = s;
            done();
        });
    });

    it('init', (done)=>{
        expect(server).to.exist();
        done();
    });

    it('should be a valid login', (done)=>{
        let options = {
            method: 'POST',
            url: '/login',
            payload: {
                email: "user@gmail.com",
                password: "root"
            }
        }
        server.inject(options, (res)=>{
            var result = res.result;
            expect(res.statusCode).to.equal(200);
            done();
        })
    });

});
