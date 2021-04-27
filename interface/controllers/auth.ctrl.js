'use strict'

const name      = 'AuthController'
const providers = { AuthService: null, Log: null }

const AuthController = {
    name,
    providers,

    controller: providers => {
        const { AuthService, Log } = providers

        return [
            {
                method: 'POST',
                path: '/signup',
                handler: async function (req, res) {
                    try {
                        const result = await AuthService.signup(req.body)

                        res.send(result)
                    } catch (err) {
                        Log(`${name} → ${this.method} → ${this.path} return error`, { danger: err })
                        res.returnError(err)
                    }
                }
            },

            {
                method: 'PUT',
                path: '/login',
                handler: async function (req, res) {
                    const { body } = req

                    try {
                        const user = await AuthService.login(body)

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
    AuthController
}
