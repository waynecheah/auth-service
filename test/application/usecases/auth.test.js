import { ApiError } from '../../../application/core'
import { AuthService } from '../../../application/usecases/auth'


function parseJwt (token) {
    const base64Url = token.split('.')[1]
    const base64    = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const payload   = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))

    return JSON.parse(payload)
}

const mockProviders = {
    ApiError,
    AuthRepo: {
        create: async (data, options) => {
            return {
                _id: '607e8ec89b1bf2001f66f97a',
                ...data
            }
        },

        find: async (query, options) => {
            const [q1, q2] = query.$or

            if (q2.username === 'waynecheah') {
                return {
                    _id: '607e8ec89b1bf2001f66f97a',
                    password: '$2a$08$R0W6hKa6Q3uavM37OMG0ZOeY8Gt9tQ4jNfd1HxTO3LPNGHx8M6EwG',
                    role_ids: ['607e930a9b1bf2001f66f985']
                }
            }

            return null
        }
    },

    CommonRepo: {
        find: async (table, query, options) => {
            if (table === 'roles') {
                const { _id, status } = query
                const [role_id] = _id?.$in
    
                if (role_id == '607e930a9b1bf2001f66f985' && status == 'active') {
                    return [
                        {
                            _id: role_id,
                            name: 'User_Management',
                            status
                        }
                    ]
                }
            }
        }
    },

    Log: (message, options) => {}
}

const { login, signup } = AuthService.service(mockProviders)

describe('Auth Service', () => {
    test('should login fail with wrong username', async () => {
        // given
        const body = {
            password: 'wrong',
            username: 'wrong'
        }

        // when
        const loginFn = login(body)

        // then
        await expect(loginFn).rejects.toThrow(ApiError)
    })

    test('should login success', async () => {
        // given
        const body = {
            password: 'abc123',
            username: 'waynecheah'
        }

        // when
        const response = await login(body)

        // then
        expect(response._id).toBe('607e8ec89b1bf2001f66f97a')
        expect(response.accessToken).toBeDefined()

        if (response.accessToken) {
            const payload = parseJwt(response.accessToken)
            const [role]  = payload?.data?.roles

            expect(role).toMatch('User_Management')
        }
    })

    test('should signup fail with username found registered', async () => {
        // given
        const body = {
            email: 'name@email.com',
            username: 'waynecheah'
        }

        try {
            // when
            await signup(body)
        } catch (err) {
            // then
            expect(()=> { throw err }).toThrow(ApiError)
            expect(err.code).toMatch('SIGNUP_USER_EXISTS')
            expect(err.status).toBe(400)
        }
    })

    test('should signup success', async () => {
        // given
        const body = {
            email: 'new@email.com',
            password: 'abc123',
            username: 'new_username'
        }

        try {
            // when
            const response = await signup(body)

            // then
            expect(response._id).toBe('607e8ec89b1bf2001f66f97a')
            expect(response.accessToken).toBeDefined()
            expect(response.password).toBeDefined()
            expect(response.expiry).toBeDefined()
        } catch { }
    })
})
