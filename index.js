'use strict'
import { init } from './infrastructure/config/bootstrap'


const main = async () => {
    try {
        const { server } = await init()

        await server.start()
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}

main()
