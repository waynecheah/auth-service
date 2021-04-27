'use strict'

const name      = 'PermissionController'
const providers = { Log: null, PermissionService: null }

const PermissionController = {
    name,
    providers,

    controller: providers => {
        const { Log, PermissionService } = providers

        return [
            {
                method: 'GET',
                path: '/permissions',
                handler: async function (req, res) {
                    try {
                        const result = await PermissionService.getPermissions(req.query)

                        res.send(result)
                    } catch (err) {
                        Log(`${name} → ${this.method} → ${this.path} return error`, { danger: err })
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
                        Log(`${name} → ${this.method} → ${this.path} return error`, { danger: err })
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
