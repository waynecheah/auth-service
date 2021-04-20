'use strict'
import fastify from 'fastify'


const Server = ({ Config }) => {
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

        start: async function () {
            try {
                const port    = Config.SERVER_PORT || 4000
                const address = await app.listen(port, '0.0.0.0')

                console.log(`Server is listening on ${address}`)
            } catch (err) {
                this.app.log.error(err)
                process.exit(1)
            }
        }
    }
}


export {
    Server
}
