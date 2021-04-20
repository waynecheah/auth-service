'use strict'

const name      = 'RoleService'
const providers = { ApiError: null, CommonRepo: null, PermissionRepo: null }
const tableName = 'roles'
const STATUS = {
    ACTIVE: 'active',
    DELETED: 'deleted',
    INACTIVE: 'inactive'
}

const RoleService = {
    name,
    providers,

    service: providers => ({
        createRole: async (body, options=null) => {
            try {
                const { ApiError, CommonRepo, PermissionRepo } = providers
                const { name, permissions=[], status=STATUS.ACTIVE } = body
                const query = {
                    name,
                    status: STATUS.ACTIVE
                }
                const role = await CommonRepo.find(tableName, query, {
                    findOne: true
                }, options)

                if (role) {
                    throw new ApiError({
                        code: 'ROLE_ALREADY_EXISTS',
                        status: 400
                    }, `The role "${body.name}" already existed in the database`)
                }

                if (!Array.isArray(permissions)) {
                    throw new ApiError({
                        code: 'INVALID_PERMISSIONS_TYPE',
                        status: 400
                    }, `The permissions must be an Array type`)
                }

                const permission_ids = []

                if (permissions.length) {
                    const allPermissions     = await PermissionRepo.find({ status: STATUS.ACTIVE })
                    const invalidPermissions = []

                    permissions.map(itm => {
                        const permission = itm.toLowerCase()
                        let permissionNotFound = true

                        if (!Array.isArray(allPermissions)) {
                            invalidPermissions.push(permission)
                            return
                        }

                        allPermissions.map(permissionObject => {
                            const { _id, name } = permissionObject

                            if (name == permission) {
                                permissionNotFound = false
                                permission_ids.push(_id)
                            }
                        })

                        if (permissionNotFound) {
                            invalidPermissions.push(permission)
                        }
                    })

                    if (invalidPermissions.length) {
                        const list = invalidPermissions.join(', ')

                        throw new ApiError({
                            code: 'INPUT_PERMISSION_NOT_FOUND',
                            data: { invalidPermissions },
                            status: 404
                        }, `The permission of [${list}] not found in system`)
                    }
                }

                return await CommonRepo.create(tableName, { name, permission_ids, status }, options)
            } catch (err) {
                console.log(`→ ${name}.createRole() return error`)
                throw err
            }
        },

        getRoles: async (query, options=null) => {
            try {
                const { CommonRepo } = providers
                const projection = { permission_ids: 0 }

                return await CommonRepo.find(tableName, query, { ...options, projection })
            } catch (err) {
                console.log(`→ ${name}.getRoles() return error`)
                throw err
            }
        }
    })
}


export {
    RoleService
}
