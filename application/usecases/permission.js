'use strict'

const name      = 'PermissionService'
const providers = { ApiError: null, PermissionRepo: null }
const STATUS = {
    ACTIVE: 'active',
    DELETED: 'deleted',
    INACTIVE: 'inactive'
}

const PermissionService = {
    name,
    providers,

    service: providers => ({
        createPermission: async (body, options=null) => {
            try {
                const { ApiError, PermissionRepo } = providers
                const { status=STATUS.ACTIVE } = body
                const name  = body.name.toLowerCase()
                const query = {
                    name,
                    status: STATUS.ACTIVE
                }
                const permission = await PermissionRepo.find(query, {
                    findOne: true
                }, options)

                if (permission) {
                    throw new ApiError({
                        code: 'PERMISSION_ALREADY_EXISTS',
                        status: 400
                    }, `The permission "${name}" already existed in the database`)
                }

                return await PermissionRepo.create({ name, status }, options)
            } catch (err) {
                console.log(`→ ${name}.createPermission() return error`)
                throw err
            }
        },

        getPermissions: async (clientQuery=null, options=null) => {
            try {
                const { PermissionRepo } = providers
                const query = {
                    ...clientQuery,
                    status: STATUS.ACTIVE
                }

                return await PermissionRepo.find(query, options)
            } catch (err) {
                console.log(`→ ${name}.getPermissions() return error`)
                throw err
            }
        }
    })
}


export {
    PermissionService
}
