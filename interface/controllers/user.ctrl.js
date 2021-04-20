'use strict'

const name      = 'UserController'
const providers = { UserService: null }

const UserController = {
    name,
    providers,

    controller: providers => {
        const { UserService={} } = providers || {}


        return [
            {
                method: 'GET',
                path: '/users/:id/roles',
                handler: async function (req, res) {
                    try {
                        const { params } = req
                        const result = await UserService.getUserRoles(params.id)

                        res.send(result)
                    } catch (err) {
                        console.log(`→ ${name} -> ${this.method} ${this.path} return error`)
                        res.returnError(err)
                    }
                }
            },
            {
                method: 'POST',
                path: '/users/:id/roles',
                handler: async function (req, res) {
                    try {
                        const { body, params } = req
                        const result = await UserService.addRoles(params.id, body)

                        res.send(result)
                    } catch (err) {
                        console.log(`→ ${name} -> ${this.method} ${this.path} return error`)
                        res.returnError(err)
                    }
                }
            },
            {
                method: 'POST',
                path: '/users/:id/permissions',
                handler: async function (req, res) {
                    try {
                        const { body, params } = req
                        const result = await UserService.checkPermissionStatus(params.id, body)

                        res.send(result)
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
    UserController
}
