'use strict'
import dotenv from 'dotenv'
import mongodb from 'mongodb'


function initConfig () {
    const config  = dotenv.config()
    const fileEnv = (config.error) ? null : config.parsed

    return (fileEnv && fileEnv.DOTENV) ? fileEnv : process.env
}

async function connect () {
    const {
        MONGODB_AUTH_DB, MONGODB_DATABASE, MONGODB_HOST, MONGODB_PASSWORD,
        MONGODB_PORT=27017, MONGODB_USE_SSL=false, MONGODB_USERNAME
    } = initConfig()
    const useSSL = (MONGODB_USE_SSL) ? '&ssl=true' : ''
    const url    = `mongodb://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/` +
                   `?authSource=${MONGODB_AUTH_DB}${useSSL}`
    const Client = new mongodb.MongoClient(url, { useUnifiedTopology: true })

    try {

        await Client.connect()

        console.log(`MongoDB on ${MONGODB_HOST} connected`)

        const Db = Client.db(MONGODB_DATABASE)

        return { Client, Db, DbReady: true }
    } catch (err) {
        console.log('MongoDB connection error:', err)
    }
}

const { Client=null, Db=null, DbReady=false } = await connect() || {}


export {
    Client,
    Db,
    DbReady
}
