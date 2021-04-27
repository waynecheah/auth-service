'use strict'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'


function _comparePassword (password, hash) {
    return bcrypt.compareSync(password, hash)
}

function _generateToken (user, roles=null, options=null) {
    const { expiryHour=1 } = options || {}
    const { _id } = user
    const data = { _id }

    if (roles) {
        data.roles = roles
    }

    const config  = dotenv.config()
    const fileEnv = (config.error) ? null : config.parsed
    const { JWT_SECRET } = (fileEnv && fileEnv.DOTENV) ? fileEnv : process.env

    const accessToken = jwt.sign({ data }, JWT_SECRET, { expiresIn: `${expiryHour}h` })
    const expiry      = new Date((new Date()).getTime() + (expiryHour * 3600000))

    return { accessToken, expiry }
}

function _hashPassword (password, options=null) {
    const { saltRounds=8 } = options || {}

    return bcrypt.hashSync(password, saltRounds)
}

const name      = 'AuthService'
const providers = { ApiError: null, AuthRepo: null, CommonRepo: null, Log: null }
const STATUS = {
    ACTIVE: 'active',
    DELETED: 'deleted',
    INACTIVE: 'inactive'
}

const AuthService = {
    name,
    providers,

    service: providers => ({
        login: async (body, options=null) => {
            const { ApiError, AuthRepo, CommonRepo, Log } = providers

            try {
                const { password: rawPassword, username } = body
                const query = {
                    $or: [
                        { email: username },
                        { username }
                    ]
                }
                const user = await AuthRepo.find(query, {
                    findOne: true
                })

                if (!user || !_comparePassword(rawPassword, user.password)) {
                    throw new ApiError({
                        code: 'INVALID_CREDENTIAL',
                        data: {
                            errorCode: (!user) ? '101' : '102'
                        },
                        status: 401
                    }, 'Invalid credential')
                }

                let roles = null

                if (Array.isArray(user.role_ids) && user.role_ids.length) {
                    const userRoles = await CommonRepo.find('roles', {
                        _id: {
                            $in: user.role_ids
                        },
                        status: STATUS.ACTIVE
                    })

                    if (Array.isArray(userRoles) && userRoles.length) {
                        roles = []

                        userRoles.map(userRole => {
                            roles.push(userRole.name)
                        })
                    }
                }

                const { accessToken, expiry } = _generateToken(user, roles, options)

                return {
                    _id: user._id,
                    accessToken,
                    expiry
                }
            } catch (err) {
                Log(`${name}.login() return error`, { danger: err })
                throw err
            }
        },

        signup: async (body, options=null) => {
            const { ApiError, AuthRepo, Log } = providers

            try {
                const { email, password: rawPassword, username } = body
                const query = {
                    $or: [
                        { email },
                        { username }
                    ]
                }

                const user = await AuthRepo.find(query, {
                    findOne: true
                })

                if (user) {
                    let messages = []

                    if (user.email == email) {
                        messages.push(`The email ${email} already registered`)
                    }
                    if (user.username == username) {
                        messages.push(`The username ${username} already registered`)
                    }

                    throw new ApiError({
                        code: 'SIGNUP_USER_EXISTS',
                        status: 400
                    }, messages.join('\r\n'))
                }

                const password = _hashPassword(rawPassword)
                const data     = { email, password, username }
                const result   = await AuthRepo.create(data, options)

                if (!result) {
                    throw new ApiError({
                        code: 'SIGNUP_PROCESS_FAILURE',
                        status: 500
                    }, 'Fail to sign up an account')
                }

                const { accessToken, expiry } = _generateToken(result, null, options)

                delete result.password

                return {
                    accessToken,
                    expiry,
                    ...result
                }
            } catch (err) {
                Log(`${name}.signup() return error`, { danger: err })
                throw err
            }
        }
    })
}


export {
    AuthService
}
