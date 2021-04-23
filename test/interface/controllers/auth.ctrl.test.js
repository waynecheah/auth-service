// import { jest } from '@jest/globals'
import { AuthService } from '../../../application/usecases/auth'
import { ApiError } from '../../../application/core'
import { AuthController } from '../../../interface/controllers/auth.ctrl'


// jest.mock('../../../application/usecases/auth')

const mockProviders = {
    AuthService: {
        login: async body => {
            if (body.username == 'waynecheah') {
                return {
                    _id: '607e8ec89b1bf2001f66f97a'
                }
            }

            throw new ApiError({
                code: 'INVALID_CREDENTIAL',
                data: {
                    errorCode: '101'
                },
                status: 401
            }, 'Invalid credential')
        },

        signup: async body => {
            const { email, password: rawPassword, username } = body

            if (username == 'waynecheah') {
                throw new ApiError({
                    code: 'SIGNUP_USER_EXISTS',
                    status: 400
                }, `The username ${username} already registered`)
            }

            return {
                _id: '607e8ec89b1bf2001f66f97a',
                username
            }
        }
    },

    Log: (message, options) => {}
}
const [signupRouter, loginRouter] = AuthController.controller(mockProviders)

describe('Auth Controller', () => {
    test('should login fail with wrong username', async () => {
        // given
        const req = {
            body: {
                username: 'wrong'
            }
        }

        // when
        await loginRouter.handler(req, {
            returnError: err => {
                // then
                expect(() => { throw err }).toThrow(ApiError)
            }
        })
    })

    test('should login success', async () => {
        // given
        const req = {
            body: {
                username: 'waynecheah'
            }
        }

        // when
        await loginRouter.handler(req, {
            send: user => {
                // then
                expect(user._id).toBe('607e8ec89b1bf2001f66f97a')
            }
        })
    })

    test('should signup fail with username found registered', async () => {
        // given
        const req = {
            body: {
                username: 'waynecheah'
            }
        }

        // when
        await signupRouter.handler(req, {
            returnError: err => {
                // then
                expect(() => { throw err }).toThrow(ApiError)
            }
        })
    })

    test('should signup success', async () => {
        // given
        const req = {
            body: {
                username: 'new_username'
            }
        }

        // when
        await signupRouter.handler(req, {
            send: user => {
                // then
                expect(user._id).toBe('607e8ec89b1bf2001f66f97a')
                expect(user.username).toBe(req.body.username)
            }
        })
    })
})
