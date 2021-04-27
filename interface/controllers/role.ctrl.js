'use strict'

const name      = 'RoleController'
const providers = { Log: null, RoleService: null }

const RoleController = {
    name,
    providers,

    controller: providers => {
        const { Log, RoleService } = providers

        return [
            {
                method: 'GET',
                path: '/roles',
                handler: async function (req, res) {
                    try {
                        const result = await RoleService.getRoles(req.query)

                        res.send(result)
                    } catch (err) {
                        Log(`${name} → ${this.method} → ${this.path} return error`, { danger: err })
                        res.returnError(err)
                    }
                }
            },

            {
                method: 'POST',
                path: '/role',
                handler: async function (req, res) {
                    const { body } = req

                    try {
                        const user = await RoleService.createRole(body)

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
    RoleController
}
