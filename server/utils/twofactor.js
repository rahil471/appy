'use strict';
const speakeasy = require('speakeasy');

module.exports.generateOtp = function(Log){

}

/**
 * @function sendOtp
 * @param {string} email - Email to send the email
 * @param {string} phoneno - Send sms
 * @param {string} otp - otp to be sent
 * @param {string} expiry - validaity of otp
 * @param {object} Log - Log object
 */
module.exports.sendOtp = function(email, phoneno, otp, expiry, Log){
    Log.note(otp);
    return new Promise((resolve, reject)=>{
        setTimeout(()=>{
            console.log(`sending email to ${email}`);
            resolve();
        }, 1000)
    });
}

/**
 * @function verifyOtp
 * @param {object} user - User object
 * @param {string} strategy - 2fa strategy
 * @param {string} otp - otp to be verified
 * @param {object} Log - Log object
 */
module.exports.verifyOtp = function(user, strategy, otp, Log){
    let verified = false;
    switch(strategy){
        case 'standard':
            const now = Date.now();
            const then = parseInt(user.twofactor.standard.otpExp, 10);
            if((user.twofactor.standard.otp == otp) && (then > now)){
                verified = true;
            }
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