'use strict'

class UserRepository {
    addUserRoles (userId) {
        throw new Error('ERR_METHOD_NOT_IMPLEMENTED')
    }

    findUser () {
        throw new Error('ERR_METHOD_NOT_IMPLEMENTED')
    }

    getUser (userId) {
        throw new Error('ERR_METHOD_NOT_IMPLEMENTED')
    }

    getUserRoles (userId) {
        throw new Error('ERR_METHOD_NOT_IMPLEMENTED')
    }

    validateUserPermissions (userId) {
        throw new Error('ERR_METHOD_NOT_IMPLEMENTED')
    }
}


export {
    UserRepository
}
