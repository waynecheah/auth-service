'use strict'
import fastify from 'fastify'


const Server = ({ Config, ErrorLog, Log }) => {
    const app = fastify({
        logger: (Config.SERVER_LOG)
    })

    app.get('/', () => ({ message: 'Welcome' }))

    return {
        app,

        bindRoutes: function (routers, options=null) {
            if (!Array.isArray(routers)) {
                // Todo(error): log error
                console.log('Fail to bind Fastify routes due to invalid array', routers)
                return
            }

            const { prefix: prefixRoute='' } = options || {}
            let prefix = ''

            if (prefixRoute) {
                prefix = (prefixRoute.substr(0, 1) == '/') ? prefixRoute : `/${prefixRoute}`
            }

            routers.map(router => {
                const [route, handler, m='GET'] = router
                const method = m.toLowerCase()
                const accept = ['get', 'head', 'post', 'put', 'delete', 'options', 'patch']

                if (
                    route &&
                    route.substr(0, 1) == '/' &&
                    method &&
                    accept.indexOf(method) !== -1 &&
                    handler &&
                    typeof handler == 'function'
                ) {
                    this.app[method](prefix + route, handler)
                }
            })
        },

        errorHandler: function (resp) {
            return error => {
                const { code='', data=null, date=null, message='', status=500 } = error
                const errorObject = { message, statusCode: status }

                if (code) {
                    errorObject.code = code
                }

                if (data) {
                    errorObject.data = data
                }

                if (date) {
                    errorObject.date = date
                }

                if (status >= 500) {
                    errorObject.message = 'Internal Server Error'
                }

                ErrorLog(error, errorObject)
                throw errorObject
            }
        },

        start: async function () {
            const prefix = 'Server::start'

            try {
                const port    = Config.SERVER_PORT || 4000
                const address = await app.listen(port, '0.0.0.0')

                Log(`Fastify server is listening on ${address}`, { success: true, prefix })
            } catch (err) {
                this.app.log.error(err)
                Log('Fastify server is fail to start', { err: true, prefix })
                process.exit(1)
            }
        }
    }
}


export {
    Server
}
