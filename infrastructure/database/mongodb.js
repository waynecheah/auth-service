'use strict'
import dotenv  from 'dotenv'
import mongodb from 'mongodb'

import { ErrorLog, Log, Retry } from '../../application/core'


function initConfig () {
    const config  = dotenv.config()
    const fileEnv = (config.error) ? null : config.parsed

    return (fileEnv && fileEnv.DOTENV) ? fileEnv : process.env
}

async function connect () {
    const {
        MONGODB_AUTH_DB, MONGODB_DATABASE, MONGODB_HOST, MONGODB_PASSWORD,
        MONGODB_PORT=27017, MONGODB_USE_SSL=false, MONGODB_USERNAME, MONGODB_URI=null
    } = initConfig()
    const useSSL = (MONGODB_USE_SSL) ? '&ssl=true' : ''
    const url    = (MONGODB_URI)
        ? MONGODB_URI
        : `mongodb://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/` +
          `?authSource=${MONGODB_AUTH_DB}${useSSL}`
    const prefix = name+'::connect'

    if (retry.current) {
        Log(`Re-attempt create mongoDB connection x${retry.current}`, { info: true, prefix })
    } else {
        Log('Attempt create mongoDB connection', { info: true, prefix })
    }

    DbReady = false
    Client  = new mongodb.MongoClient(url, { useUnifiedTopology: true })

    onClientConnected(Client)

    try {
        await Client.connect()
    } catch (err) {
        if (retry.current) {
            Log('MongoDB retry connection failure...', { err: true, prefix })
        } else {
            Log('MongoDB connection error 😱', { err: true, prefix })
            ErrorLog(err)
        }

        retry.do(connect)
        return
    }

    const host = (MONGODB_URI) ? Client.s?.options?.srvHost : MONGODB_HOST

    if (retry.current) {
        Log(`Database connection on "_${host}_" has resumed! 😅`, { prefix, success: true })
        retry.reset()
    } else {
        Log(`MongoDB on "_${host}_" connected`, { prefix, success: true })
    }

    try {
        Db = Client.db(MONGODB_DATABASE)
        Log(`MongoDB uses "_${MONGODB_DATABASE}_" database`, { prefix, success: true })
        // onDbConnected(Db)
    } catch (err) {
        Log(`MongoDB fail to use database "_${MONGODB_DATABASE}_"`, { err: true, prefix })
        ErrorLog(err)
        return
    }

    DbReady = true

    return { Client, Db, DbReady }
}

function onClientConnected (Client) {
    const prefix      = name + '::onClientConnected'
    const failOptions = { err: true, prefix }
    const infoOptions = { info: true, prefix }

    if (retry.current < 1) {
        Log('Bind mongoDB SDAM events', infoOptions)
    }

    Client.on('authenticated', () => {
        if (retry.current < 1) {
            Log('MongoDB connection to database has authenticated 🔓', infoOptions)
        }
    }).on('close', () => {
        if (retry.current < 1) {
            Log('MongoDB client connection has closed! 😯', failOptions)
        }
    }).on('serverHeartbeatFailed', () => {
        if (retry.current < 1) {
            Log('MongoDB server heartbeat failed! 😨', failOptions)
            retry.do(connect)
        }
    }).on('serverHeartbeatStarted', () => {
        // Log('MongoDB server heartbeat started! 💓', infoOptions)
    }).on('serverHeartbeatSucceeded', () => {
        // Log('MongoDB server heartbeat succeeded! 💞', infoOptions)
    }).on('connectionPoolClosed', () => {
        if (retry.current < 1) {
            Log('MongoDB server connection pool has closed! 🚫', failOptions)
        }
    }).on('serverClosed', () => {
        // Log('MongoDB server connection has closed! 🚫', failOptions)
    }).on('topologyClosed', () => {
        // Log('MongoDB topology connection has closed! 🚫', failOptions)
    }).on('error', () => {
        Log('MongoDB connection got error 🆘', failOptions)
    }).on('timeout', () => {
        Log('MongoDB connection timeout ⏱️', failOptions)
    })
}

function onDbConnected (Db) {
    const failOptions = { err: true, prefix: name }
    const infoOptions = { info: true, prefix: name }

    Log('Bind mongoDB DB events', { info: true, prefix: `${name}:DB` })

    Db.on('close', () => {
        Log('MongoDB connection has disconnected! 😨', failOptions)
    }).on('error', () => {
        Log('MongoDB connection got error 🤔', failOptions)
    }).on('fullsetup', () => {
        Log('MongoDB servers in the topology have been connected to at start up time', infoOptions)
    }).on('reconnect', () => {
        Log('MongoDB connection reconnect', failOptions)
    }).on('timeout', () => {
        Log('MongoDB connection timeout', failOptions)
    })
}


const Mongo = {
    db: async ()=>{
        if (!Db) {
            retry.do(connect, { increment: false })
            throw new Error('Connection to mongoDB server is failed')
        }

        try {
            const { ok } = await Db.admin().ping()

            if (ok !== 1) {
                retry.do(connect, { increment: false })
                return
            }

            return Db
        } catch (err) {
            if (err.message && err.message.indexOf('getaddrinfo ENOTFOUND') !== -1) {
                retry.do(connect, { increment: false })
                throw new Error('Connection to mongoDB server is closed')
            }

            throw err
        }
    },

    objectID: id => {
        return new mongodb.ObjectID(id)
    },

    isConnected: ()=>{
        if (!Client || !Client.isConnected) return false

        return Client.isConnected() && DbReady
    },

    isValidID: id => {
        return mongodb.ObjectID.isValid(id)
    },

    reconnect: ()=>{
        retry.do(connect)
    }
}
const name  = 'MongoDB'
const retry = new Retry({ log: Log, name: 'mongoDB connection' })
let Client    = null
let Db        = null
let DbReady   = false

await connect()


export {
    Client,
    Db,
    DbReady,
    Mongo
}
