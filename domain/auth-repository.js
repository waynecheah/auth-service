'use strict'

class AuthRepository {
    signUp (username, email, password) {
        throw new Error('ERR_METHOD_NOT_IMPLEMENTED')
    }

    login (username, password) {
        throw new Error('ERR_METHOD_NOT_IMPLEMENTED')
    }
}


export {
    AuthRepository
}
