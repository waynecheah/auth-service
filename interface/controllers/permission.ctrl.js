'use strict'

const name      = 'PermissionController'
const providers = { PermissionService: null }

const PermissionController = {
    name,
    providers,

    controller: providers => {
        const { PermissionService={} } = providers || {}


        return [
            {
                method: 'GET',
                path: '/permissions',
                handler: async (req, res) => {
                    try {
                        const result = await PermissionService.getPermissions(req.query)

                        res.send(result)
                    } catch (err) {
                        console.log(`→ ${name} -> GET /permissions return error`)
                        res.returnError(err)
                    }
                }
            },
            {
                method: 'POST',
                path: '/permission',
                handler: async function (req, res) {
                    const { body } = req

                    try {
                        const user = await PermissionService.createPermission(body)

                        res.send(user)
                    } catch (err) {
                        console.log(`→ ${name} -> ${this.method} ${this.path} return error`)
                        res.returnError(err)
                    }
                }
            }
        ]
    }
}


export {
    PermissionController
}
