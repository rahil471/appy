'use strict';
const speakeasy = require('speakeasy');

module.exports.generateOtp = function(Log){

}

module.exports.verifyOtp = function(user, strategy, otp, Log){
    let verified = false;
    switch(strategy){
        case 'standard':
            verified = user.twofactor.standard.otp == otp;
        break;
        case 'totp':
            verified = speakeasy.totp.verify({
                secret: user.twofactor.totp.secret,
                encoding: 'base32',
                token: otp
            });
        break;
        default:
            Log.error("Invalid Strategy in twofactor");
    }
    return verified;
}