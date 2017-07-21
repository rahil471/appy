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

// describe('Functional Tests - User', ()=>{
//     // let server;
//     // let authorization;
//     // before((done)=>{
//     //     Composer((err, s)=>{
//     //         if(err) {
//     //             return done(err);
//     //         }
//     //         server = s;
//     //         let options = {
//     //             method: 'POST',
//     //             url: '/login',
//     //             payload: {
//     //                 email: "admin@gmail.com",
//     //                 password: "root"
//     //             }
//     //         }
//     //         server.inject(options, (res)=>{
//     //             let result = res.result;
//     //             if(result.statusCode === 200){
//     //                 authorization = result.authHeader;
//     //                 done();
//     //             } else {
//     //                 done(result.statusCode);
//     //             }
//     //         });
//     //     });
//     // });

//     // it('init', (done)=>{
//     //     expect(server).to.exist();
//     //     done();
//     // });

//     // it('should fetch users', (done)=>{
//     //     let options = {
//     //         method: 'GET',
//     //         url: '/user',
//     //         headers:{
//     //             authorization: authorization
//     //         }
//     //     }
//     //     server.inject(options, (res)=>{
//     //         var result = res.result;
//     //         expect(res.statusCode).to.equal(200);
//     //         expect(req.result).to.be.an.array();
//     //         done();
//     //     })
//     // });

// });

// describe('Functional Tests - Authentication', ()=>{

//     it('should be a valid login', (done)=>{
//         let options = {
//             method: 'POST',
//             url: '/login',
//             payload: {
//                 email: "user@gmail.com",
//                 password: "root"
//             }
//         }
//         server.inject(options, (res)=>{
//             var result = res.result;
//             expect(res.statusCode).to.equal(200);
//             done();
//         })
//     });
// });