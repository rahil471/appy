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
describe('Unit Tests - Saml |', () => {
    let server;
    // let User;
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

    it("should find saml login app credentials!", (done) => {
        let provider = "SSOCircle";
        useroperations.getSamlLoginAppCredentials(provider).then(result => {

            result = (result === null ? {} : result);
            expect(result).to.be.an.object();
            if (Object.keys(result).length) {
                expect(result.provider).to.be.equal(provider);
            } else {
                expect(result).to.equal({});
            }
            done();
        }).catch((err) => {
            console.log(err)
            expect(false).to.be.equal(true);
            done();
        });
    });

    it("should give an instence of service provider or identity provider!", (done) => {
        let configData = {
            _id: '599c34be7e5c98009f570393',
            provider: 'SSOCircle',
            metadata_secrete: 'qwertyuiop',
            sso_login_url: 'https://idp.ssocircle.com:443/sso/SSORedirect/metaAlias/publicidp',
            sso_logout_url: 'https://idp.ssocircle.com:443/sso/IDPSloRedirect/metaAlias/publicidp',
            certificates: '-----BEGIN CERTIFICATE-----\nMIIEYzCCAkugAwIBAgIDIAZmMA0GCSqGSIb3DQEBCwUAMC4xCzAJBgNVBAYTAkRF\nMRIwEAYDVQQKDAlTU09DaXJjbGUxCzAJBgNVBAMMAkNBMB4XDTE2MDgwMzE1MDMy\nM1oXDTI2MDMwNDE1MDMyM1owPTELMAkGA1UEBhMCREUxEjAQBgNVBAoTCVNTT0Np\ncmNsZTEaMBgGA1UEAxMRaWRwLnNzb2NpcmNsZS5jb20wggEiMA0GCSqGSIb3DQEB\nAQUAA4IBDwAwggEKAoIBAQCAwWJyOYhYmWZF2TJvm1VyZccs3ZJ0TsNcoazr2pTW\ncY8WTRbIV9d06zYjngvWibyiylewGXcYONB106ZNUdNgrmFd5194Wsyx6bPvnjZE\nERny9LOfuwQaqDYeKhI6c+veXApnOfsY26u9Lqb9sga9JnCkUGRaoVrAVM3yfghv\n/Cg/QEg+I6SVES75tKdcLDTt/FwmAYDEBV8l52bcMDNF+JWtAuetI9/dWCBe9VTC\nasAr2Fxw1ZYTAiqGI9sW4kWS2ApedbqsgH3qqMlPA7tg9iKy8Yw/deEn0qQIx8Gl\nVnQFpDgzG9k+jwBoebAYfGvMcO/BDXD2pbWTN+DvbURlAgMBAAGjezB5MAkGA1Ud\nEwQCMAAwLAYJYIZIAYb4QgENBB8WHU9wZW5TU0wgR2VuZXJhdGVkIENlcnRpZmlj\nYXRlMB0GA1UdDgQWBBQhAmCewE7aonAvyJfjImCRZDtccTAfBgNVHSMEGDAWgBTA\n1nEA+0za6ppLItkOX5yEp8cQaTANBgkqhkiG9w0BAQsFAAOCAgEAAhC5/WsF9ztJ\nHgo+x9KV9bqVS0MmsgpG26yOAqFYwOSPmUuYmJmHgmKGjKrj1fdCINtzcBHFFBC1\nmaGJ33lMk2bM2THx22/O93f4RFnFab7t23jRFcF0amQUOsDvltfJw7XCal8JdgPU\ng6TNC4Fy9XYv0OAHc3oDp3vl1Yj8/1qBg6Rc39kehmD5v8SKYmpE7yFKxDF1ol9D\nKDG/LvClSvnuVP0b4BWdBAA9aJSFtdNGgEvpEUqGkJ1osLVqCMvSYsUtHmapaX3h\niM9RbX38jsSgsl44Rar5Ioc7KXOOZFGfEKyyUqucYpjWCOXJELAVAzp7XTvA2q55\nu31hO0w8Yx4uEQKlmxDuZmxpMz4EWARyjHSAuDKEW1RJvUr6+5uA9qeOKxLiKN1j\no6eWAcl6Wr9MreXR9kFpS6kHllfdVSrJES4ST0uh1Jp4EYgmiyMmFCbUpKXifpsN\nWCLDenE3hllF0+q3wIdu+4P82RIM71n7qVgnDnK29wnLhHDat9rkC62CIbonpkVY\nmnReX0jze+7twRanJOMCJ+lFg16BDvBcG8u0n/wIDkHHitBI7bU1k6c6DydLQ+69\nh8SCo6sO9YuD+/3xAGKad4ImZ6vTwlB4zDCpu6YgQWocWRXE+VkOb+RBfvP755PU\naLfL63AFVlpOnEpIio5++UjNJRuPuAA=\n-----END CERTIFICATE-----',
            private_key: '-----BEGIN CERTIFICATE-----\nMIIEYzCCAkugAwIBAgIDIAZmMA0GCSqGSIb3DQEBCwUAMC4xCzAJBgNVBAYTAkRF\nMRIwEAYDVQQKDAlTU09DaXJjbGUxCzAJBgNVBAMMAkNBMB4XDTE2MDgwMzE1MDMy\nM1oXDTI2MDMwNDE1MDMyM1owPTELMAkGA1UEBhMCREUxEjAQBgNVBAoTCVNTT0Np\ncmNsZTEaMBgGA1UEAxMRaWRwLnNzb2NpcmNsZS5jb20wggEiMA0GCSqGSIb3DQEB\nAQUAA4IBDwAwggEKAoIBAQCAwWJyOYhYmWZF2TJvm1VyZccs3ZJ0TsNcoazr2pTW\ncY8WTRbIV9d06zYjngvWibyiylewGXcYONB106ZNUdNgrmFd5194Wsyx6bPvnjZE\nERny9LOfuwQaqDYeKhI6c+veXApnOfsY26u9Lqb9sga9JnCkUGRaoVrAVM3yfghv\n/Cg/QEg+I6SVES75tKdcLDTt/FwmAYDEBV8l52bcMDNF+JWtAuetI9/dWCBe9VTC\nasAr2Fxw1ZYTAiqGI9sW4kWS2ApedbqsgH3qqMlPA7tg9iKy8Yw/deEn0qQIx8Gl\nVnQFpDgzG9k+jwBoebAYfGvMcO/BDXD2pbWTN+DvbURlAgMBAAGjezB5MAkGA1Ud\nEwQCMAAwLAYJYIZIAYb4QgENBB8WHU9wZW5TU0wgR2VuZXJhdGVkIENlcnRpZmlj\nYXRlMB0GA1UdDgQWBBQhAmCewE7aonAvyJfjImCRZDtccTAfBgNVHSMEGDAWgBTA\n1nEA+0za6ppLItkOX5yEp8cQaTANBgkqhkiG9w0BAQsFAAOCAgEAAhC5/WsF9ztJ\nHgo+x9KV9bqVS0MmsgpG26yOAqFYwOSPmUuYmJmHgmKGjKrj1fdCINtzcBHFFBC1\nmaGJ33lMk2bM2THx22/O93f4RFnFab7t23jRFcF0amQUOsDvltfJw7XCal8JdgPU\ng6TNC4Fy9XYv0OAHc3oDp3vl1Yj8/1qBg6Rc39kehmD5v8SKYmpE7yFKxDF1ol9D\nKDG/LvClSvnuVP0b4BWdBAA9aJSFtdNGgEvpEUqGkJ1osLVqCMvSYsUtHmapaX3h\niM9RbX38jsSgsl44Rar5Ioc7KXOOZFGfEKyyUqucYpjWCOXJELAVAzp7XTvA2q55\nu31hO0w8Yx4uEQKlmxDuZmxpMz4EWARyjHSAuDKEW1RJvUr6+5uA9qeOKxLiKN1j\no6eWAcl6Wr9MreXR9kFpS6kHllfdVSrJES4ST0uh1Jp4EYgmiyMmFCbUpKXifpsN\nWCLDenE3hllF0+q3wIdu+4P82RIM71n7qVgnDnK29wnLhHDat9rkC62CIbonpkVY\nmnReX0jze+7twRanJOMCJ+lFg16BDvBcG8u0n/wIDkHHitBI7bU1k6c6DydLQ+69\nh8SCo6sO9YuD+/3xAGKad4ImZ6vTwlB4zDCpu6YgQWocWRXE+VkOb+RBfvP755PU\naLfL63AFVlpOnEpIio5++UjNJRuPuAA=\n-----END CERTIFICATE-----',
            sso_response_mapping: {
                email: 'user.attributes.EmailAddress[0]',
                id: 'response_header.id',
                firstName: 'user.attributes.FirstName[0]',
                lastName: 'user.attributes.LastName[0]'
            },
            force_authn: false
        };
        let providerType = 'sp';
        let clientURL = '127.0.0.1';
        useroperations.initProvider(providerType, configData, clientURL)
            .then(result => {
                expect(result).to.be.an.object();
                return;
            })
            .then(_ => useroperations.initProvider('idp', configData, clientURL))
            .then(result => {
                expect(result).to.be.an.object();
                done();
            })
            .catch((err) => {
                console.log(err)
                expect(false).to.be.equal(true);
                done();
            });
    });
});