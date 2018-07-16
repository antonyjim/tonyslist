/*
    Error Legend:

    460 : Missing Password
    461 : Missing New Password
    462 : Missing Username
    463 : Unexpected Data
    464 : Invalid User
    465 : User already exists
    466 : User exists and is you
    467 : Mismatched Verification
    468 : Empty Body
*/

exports.Error = function (code, status) {
    this.code = code,
    this.message = status
}