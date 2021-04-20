'use strict'

class Role {
    constructor ({ _id=null, name, permission_ids=[], status='active' }) {
        this._id            = _id
        this.name           = name
        this.permission_ids = permission_ids
        this.status         = status
    }
}


export {
    Role
}
