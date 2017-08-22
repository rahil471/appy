// 'use strict';

// const RestHapi = require('rest-hapi');
// const LabbableServer = require('../../server.js');
// const mongoose = require('mongoose');
// const Lab = require('lab');
// const lab         = exports.lab = Lab.script();
// // use some BDD verbage instead of lab default
// const describe    = lab.describe;
// const it          = lab.it;
// const after       = lab.after;
// const beforeEach = lab.beforeEach;
// const before = lab.before;

// const Code = require('code');
// const expect      = Code.expect;

// describe('Functional Tests - User', ()=>{
//     let server;
//     let authorization;
//     let user;
//     before((done)=>{
//          LabbableServer.ready((err, s)=>{
//              console.log('brady');
//             if(err) {
//                 return done(err);
//             }
//             server = s;
//             let options = {
//                 method: 'POST',
//                 url: '/login',
//                 payload: {
//                     username: "manager@gmail.com",
//                     password: "root"
//                 }
//             }
//             server.inject(options, (res)=>{
//                 let result = res.result;
//                 user = result.user;
//                 console.log(res.statusCode);
//                 if(res.statusCode === 200){
//                     authorization = result.authHeader;
//                     return done();
//                 } else {
//                     return done(result.statusCode);
//                 }
//             });
//         });
//     });

//     it('init', (done)=>{
//         expect(server).to.exist();
//         done();
//     });

//     it('authorization should exists', (done)=>{
//         expect(authorization).to.not.be.undefined();
//         done();
//     });

//     it('should exist', (done)=>{
//         expect(user).to.exist();
//         done();
//     });

//     it('should fetch users', (done)=>{
//         let options = {
//             method: 'GET',
//             url: '/user',
//             headers:{
//                 authorization: authorization
//             }
//         }
//         server.inject(options, (res)=>{
//             var result = res.result;
//             expect(res.statusCode).to.equal(200);
//             expect(res.result.docs).to.exist();
//             expect(res.result.docs).to.be.an.array();
//             done();
//         });
//     });

//     it('should fecth a single user by id', (done)=>{
//         let options = {
//             method: 'GET',
//             url: `/user/${user._id}`,
//             headers:{
//                 authorization: authorization
//             }
//         }
//         server.inject(options, (res)=>{
//             var result = res.result;
//             expect(res.statusCode).to.equal(200);
//             expect(res.result).to.exist();
//             expect(res.result).to.be.an.object();
//             expect(res.result._id).to.equal(user._id.toString());
//             done();
//         });
//     });

// });