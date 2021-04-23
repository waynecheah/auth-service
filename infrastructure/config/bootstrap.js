'use strict'
import dotenv from 'dotenv'

import * as coreProviders from '../../application/core'


function dependencyInjection (dependencyTree, providers, service, options=null) {
    const { init=true } = options || {}
    const requiredProviders = (providers) ? Object.keys(providers) : null
    const providersNotFound = []

    // if class requires inject any dependency
    if (
        Array.isArray(requiredProviders) &&
        requiredProviders.length
    ) {
        const providerObjects = {}

        requiredProviders.map(providerName => {
            if (providerName in coreProviders) {
                providerObjects[providerName] = coreProviders[providerName]
            } else if (providerName in dependencyTree) {
                providerObjects[providerName] = dependencyTree[providerName]
            } else {
                providersNotFound.push(providerName)
            }
        })

        if (providersNotFound.length) {
            return [
                true,
                providersNotFound
            ]
        }

        if (init) {
            return [
                null, service(providerObjects)
            ]
        }
    } else if (init) {
        return [
            null, service()
        ]
    }

    return [
        null, null
    ]
}

function initConfig () {
    const config  = dotenv.config()
    const fileEnv = (config.error) ? null : config.parsed

    return (fileEnv && fileEnv.DOTENV) ? fileEnv : process.env
}

async function initServer (env) {
    const { SERVER=null } = env

    process.stdout.write('\x1Bc')

    if (SERVER === 'express') {
        const { Server } = await import('../webserver/express')
        const express    = await import('express')
        const bodyParser = await import('body-parser')
        const server     = Server({ Config: env })
        const router     = express.Router()

        router.use((req, res, next)=>{
            const { ip, method, protocol, subdomains, url } = req
            const host = req.get('host')
            const time = (new Date()).toLocaleTimeString()

            res.returnError = server.errorHandler(res, coreProviders)

            process.stdout.write('\x1Bc')
            console.log(`> ${time} - ${method} ${protocol}://${subdomains}${host}${url} - ${ip}`)
            next()
        })
        server.app.use(bodyParser.default.json())
        server.app.use(router)

        return server
    }

    if (SERVER === 'fastify') {
        const { Server } = await import('../webserver/fastify')
        const server = Server({ Config: env })

        server.app.addHook('onRequest', (req, _, done)=>{
            const { hostname, ip, method, protocol, raw, url } = req
            const time = (new Date()).toLocaleTimeString()

            process.stdout.write('\x1Bc')
            console.log(`> ${time} - ${method} ${protocol}://${hostname}${url} - ${ip}`)
            done()
        })

        return server
    }

    const message = (SERVER)
        ? `Server "${SERVER}" is not implemented`
        : 'Server is not defined'

    throw new Error(message)
}

async function initDatabase (env, errorInjection) {
    const { DB_DRIVER=null } = env
    const repositories = {}

    if (DB_DRIVER === 'mongodb') {
        const providers    = await import('../database/mongodb')
        const mongoDbRepos = await import('../repositories/mongodb')

        Object.entries(mongoDbRepos).map(([name, container]) => {
            const opts = { init: (!errorInjection.length) }
            const [
                error, result
            ] = dependencyInjection(providers, container.providers, container.repository, opts)

            if (error) {
                // record error and process after this will fail and stop running
                errorInjection.push({
                    name,
                    providers: result,
                    type: 'repository'
                })
            } else if (result) {
                repositories[name] = result
            }
        })

        return repositories
    }

    if (DB_DRIVER === 'mssql') {
        // const { connection, dbReady } = await import('../database/mssql')
        const msSqlRepos = await import('../repositories/mssql')
        const providers  = {}

        Object.entries(msSqlRepos).map(([name, repositoryClass]) => {
            const opts = { init: (!errorInjection.length) }
            const [
                error, result
            ] = dependencyInjection({}, repositoryClass.providers, repositoryClass.repository, opts)

            if (error) {
                // record error and process after this will fail and stop running
                errorInjection.push({
                    name,
                    providers: result,
                    type: 'repository'
                })
            } else if (result) {
                repositories[name] = result
            }
        })

        return repositories
    }

    if (DB_DRIVER) {
        throw new Error(`Database driver "${DB_DRIVER}" is not found`)
    }

    // no database driver defined
}

async function injectRepoToService (repositories, errorInjection) {
    const services = {}
    const useCases = await import('../../application/usecases')

    // inject required repositories into services
    Object.entries(useCases).map(([name, container]) => {
        if (name.indexOf('Service') === -1) return


        const opts = { init: (!errorInjection.length) }
        const [
            error, result
        ] = dependencyInjection(repositories, container.providers, container.service, opts)

        if (error) {
            // record error and process after this will fail and stop running
            errorInjection.push({
                name,
                providers: result,
                type: 'service'
            })
        } else if (result) {
            services[name] = result
        }
    })

    return services
}

async function injectServiceToController (services, errorInjection) {
    const controllers      = await import('../../interface/controllers')
    const controllerRoutes = []
    const routers          = []

    // inject required services into controllers
    Object.entries(controllers).map(([name, container]) => {
        if (name.indexOf('Controller') === -1) return


        const opts = { init: (!errorInjection.length) }
        const [
            error, result
        ] = dependencyInjection(services, container.providers, container.controller, opts)

        if (error) {
            // record error and process after this will fail and stop running
            errorInjection.push({
                name,
                providers: result,
                type: 'controller'
            })
        } else if (result) {
            makeRouters(result, routers)
        }
    })

    return routers
}

function makeRouters (controllerRouters, routers) {
    if (Array.isArray(controllerRouters)) {
        controllerRouters.map(controllerRouter => {
            const { handler, method='GET', path } = controllerRouter

            routers.push([path, handler.bind(controllerRouter), method])
        })
    }
}

const init = async () => {
    const env    = initConfig()
    const result = {
        core: {},
        repositories: {},
        server: null,
        services: {}
    }
    const errorInjection = []

    result.core         = coreProviders
    result.server       = await initServer(env)
    result.repositories = await initDatabase(env, errorInjection)
    result.services     = await injectRepoToService(result.repositories, errorInjection)

    const routers = await injectServiceToController(result.services, errorInjection)

    if (errorInjection.length) {
        errorInjection.map(err => {
            const { providers, name, type } = err

            console.log(`${name} requires provider "${providers.join(', ')}"`)
        })

        throw new Error('Process has failed on dependency injection')
    }

    // bind routers to the app (server)
    result.server.bindRoutes(routers, { prefix: env.PREFIX_ROUTE })

    return result
}


export {
    init
}
