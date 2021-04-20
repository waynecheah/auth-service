'use strict'

class Permission {
    constructor ({ _id=null, name, status='active' }) {
        this._id    = _id
        this.name   = name
        this.status = status
    }
}


export {
    Permission
}
