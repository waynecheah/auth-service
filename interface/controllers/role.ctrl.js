'use strict'

const name      = 'RoleController'
const providers = { RoleService: null }

const RoleController = {
    name,
    providers,

    controller: providers => {
        const { RoleService={} } = providers || {}


        return [
            {
                method: 'GET',
                path: '/roles',
                handler: async (req, res) => {
                    try {
                        const result = await RoleService.getRoles(req.query)

                        res.send(result)
                    } catch (err) {
                        console.log(`→ ${name} -> ${this.method} ${this.path} return error`)
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
                        console.log(`→ ${name} -> ${this.method} ${this.path} return error`)
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
