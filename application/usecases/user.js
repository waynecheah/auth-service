'use strict'

const name      = 'UserService'
const providers = { ApiError: null, CommonRepo: null, PermissionRepo: null }
const tableName = 'users'
const STATUS = {
    ACTIVE: 'active',
    DELETED: 'deleted',
    INACTIVE: 'inactive'
}

const UserService = {
    name,
    providers,

    service: providers => ({
        addRoles: async (user_id, data, options=null) => {
            try {
                const { ApiError, CommonRepo } = providers
                const { roles } = data
                const user = await CommonRepo.findById(tableName, user_id, options)

                if (!user) {
                    throw new ApiError({
                        code: 'USER_ID_NOT_FOUND',
                        status: 404
                    }, `The user with id "${user_id}" is not found`)
                }

                if (!Array.isArray(roles) || roles.length === 0) {
                    throw new ApiError({
                        code: 'INVALID_USER_ROLES',
                        status: 400
                    }, `The roles must be an Array type with at least 1 role`)
                }

                const role_ids = []
                const result   = {
                    user: {
                        _id: user._id,
                        username: user.username
                    },
                    roles: []
                }

                const allRoles     = await CommonRepo.find('roles', { status: STATUS.ACTIVE })
                const invalidRoles = []

                roles.map(role => {
                    let roleNotFound = true

                    if (!Array.isArray(allRoles)) {
                        invalidRoles.push(role)
                        return
                    }

                    allRoles.map(roleObject => {
                        const { _id, name, permission_ids } = roleObject

                        if (name == role) {
                            roleNotFound = false
                            role_ids.push(_id)
                            result.roles.push({ _id, name })
                        }
                    })

                    if (roleNotFound) {
                        invalidRoles.push(role)
                    }
                })

                if (invalidRoles.length) {
                    const list = invalidRoles.join(', ')

                    throw new ApiError({
                        code: 'INPUT_ROLE_NOT_FOUND',
                        data: { invalidRoles },
                        status: 404
                    }, `The role of [${list}] not found in system`)
                }

                const { ok=0 } = await CommonRepo.update(tableName, { _id: user._id }, { role_ids }, options)

                return (ok) ? result : []
            } catch (err) {
                console.log(`→ ${name}.addRoles() return error`)
                throw err
            }
        },

        checkPermissionStatus: async (user_id, data, options=null) => {
            try {
                const { ApiError, CommonRepo, PermissionRepo } = providers
                const { ids=null, permissions=null } = data
                const user   = await CommonRepo.findById(tableName, user_id, options)
                const result = []

                if (!user) {
                    throw new ApiError({
                        code: 'USER_ID_NOT_FOUND',
                        status: 404
                    }, `The user with id "${user_id}" is not found`)
                }

                if (
                    (
                        !Array.isArray(ids) ||
                        !ids.length
                    ) &&
                    (
                        !Array.isArray(permissions) ||
                        !permissions.length
                    )
                ) return []

                const allPermissionsAry = await PermissionRepo.find({ status: STATUS.ACTIVE })
                const allPermissionsObj = {}
                const userPermissionIds = []

                if (Array.isArray(allPermissionsAry)) {
                    allPermissionsAry.map(permission => {
                        const { _id, name } = permission
                        const id = (_id.toString) ? _id.toString() : _id

                        allPermissionsObj[id] = name
                    })
                }

                if (Array.isArray(user.role_ids) && user.role_ids.length) {
                    const userRoles = await CommonRepo.find('roles', {
                        _id: {
                            $in: user.role_ids
                        },
                        status: STATUS.ACTIVE
                    })
    
                    if (Array.isArray(userRoles) || userRoles.length) {
                        userRoles.map(userRole => {
                            const { permission_ids=[] } = userRole || {}

                            if (Array.isArray(permission_ids)) {
                                permission_ids.map(permission_id => {
                                    const id = (permission_id.toString) ? permission_id.toString() : permission_id
                                    userPermissionIds.push(id)
                                })
                            }
                        })
                    }
                }

                if (Array.isArray(ids) && ids.length) {
                    const uniquePermissionIds = [...new Set(userPermissionIds)]

                    ids.map(id => {
                        const allow      = (uniquePermissionIds.indexOf(id) !== -1)
                        const permission = allPermissionsObj[id] || null

                        result.push({ allow, id, permission })
                    })
                } else if (Array.isArray(permissions) && permissions.length) {
                    const allNotAllow = (!Array.isArray(allPermissionsAry) || !allPermissionsAry.length)
                    const uniquePermissionIds = [...new Set(userPermissionIds)]
 
                    permissions.map(permission => {
                        if (allNotAllow) {
                            result.push({ allow: false, id: null, permission })
                            return
                        }

                        const itm = { allow: false, id: null, permission }

                        allPermissionsAry.map(permissionObj => {
                            const { _id, name } = permissionObj
                            if (name == permission.toLowerCase()) {
                                const id = (_id.toString) ? _id.toString() : _id

                                itm.allow = (uniquePermissionIds.indexOf(id) !== -1)
                                itm.id    = id
                            }
                        })

                        result.push(itm)
                    })
                }

                return result
            } catch (err) {
                console.log(`→ ${name}.checkPermissionStatus() return error`)
                throw err
            }
        },

        getUserRoles: async (user_id, options=null) => {
            try {
                const { ApiError, CommonRepo } = providers

                const user = await CommonRepo.findById(tableName, user_id, options)

                if (!user) {
                    throw new ApiError({
                        code: 'USER_ID_NOT_FOUND',
                        status: 404
                    }, `The user with id "${user_id}" is not found`)
                }

                if (!Array.isArray(user.role_ids) || !user.role_ids.length) {
                    return []
                }

                return await CommonRepo.find('roles', {
                    _id: {
                        $in: user.role_ids
                    },
                    status: STATUS.ACTIVE
                }, {
                    projection: {
                        _id: 1,
                        name: 1
                    }
                })
            } catch (err) {
                console.log(`→ ${name}.getUserRoles() return error`)
                throw err
            }
        }
    })
}


export {
    UserService
}
