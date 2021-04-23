'use strict'
import express from 'express'


const Server = ({ Config }) => {
    const app = express()

    app.get('/', (_, res) => {
        res.send({ message: 'Welcome' })
    })

    return {
        app,

        bindRoutes: function (routers, options=null) {
            if (!Array.isArray(routers)) {
                // Todo(error): log error
                console.log('Fail to bind Express routes due to invalid array', routers)
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

        errorHandler: function (resp, { ErrorLog }) {
            return error => {
                const { code='', data=null, date=null, message='', status=500 } = error
                const errorObject = { message, status }

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
                resp.status(status).json(errorObject)
            }
        },

        start: async function () {
            try {
                const host = '0.0.0.0'
                const port = Config.SERVER_PORT || 4000

                app.listen(port, host, ()=>{
                    console.log(`Express Server is listening on http://${host}:${port}`)
                })
            } catch (err) {
                console.log(err)
                process.exit(1)
            }
        }
    }
}


export {
    Server
}
