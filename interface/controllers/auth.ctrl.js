'use strict'

const providers = { AuthService: null, Log: null }

const AuthController = {
    providers,

    controller: providers => {
        const { AuthService={}, Log } = providers || {}


        return [
            {
                method: 'POST',
                path: '/signup',
                handler: async (req, res) => {
                    try {
                        const result = await AuthService.signup(req.body)

                        res.send(result)
                    } catch (err) {
                        Log('AuthController -> POST /signup return error', { danger: err })
                        res.returnError(err)
                    }
                }
            },

            {
                method: 'PUT',
                path: '/login',
                handler: async (req, res) => {
                    const { body } = req

                    try {
                        const user = await AuthService.login(body)

                        res.send(user)
                    } catch (err) {
                        Log('AuthController -> PUT /login return error', { danger: err })
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
