'use strict'

class User {
    constructor ({ _id=null, username, email, password, role_ids=[] }) {
        this._id = _id
        this.username = username
        this.email = email
        this.password = password
        this.role_ids = role_ids
    }
}


export {
    User
}
