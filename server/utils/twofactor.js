'use strict';
const speakeasy = require('speakeasy');

module.exports.generateOtp = function(Log){

}

module.exports.sendOtp = function(email, phoneno, otp, expiry, Log){
    Log.note(otp);
    return new Promise((resolve, reject)=>{
        setTimeout(()=>{
            console.log(`sending email to ${email}`);
            resolve();
        }, 1000)
    });
}

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