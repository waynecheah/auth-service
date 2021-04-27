'use strict'
import dotenv  from 'dotenv'
import tedious from 'tedious'

import { ErrorLog, Log, Retry } from '../../application/core'


function connect () {
    const { MSSQL_DATABASE, MSSQL_HOST, MSSQL_PASSWORD, MSSQL_USERNAME } = initConfig()
    const config = {
        server: MSSQL_HOST,
        options: {
            encrypt: false,
            database: MSSQL_DATABASE,
            rowCollectionOnRequestCompletion: true
        },
        authentication: {
          type: 'default',
          options: {
              userName: MSSQL_USERNAME,
              password: MSSQL_PASSWORD
          }
        }
    }
    const prefix = name+'::connect'

    if (retry.current) {
        Log(`Re-attempt create ${name} connection x${retry.current}`, { info: true, prefix })
    } else {
        Log(`Attempt create ${name} connection`, { info: true, prefix })
    }

    dbReady    = false
    Connection = new tedious.Connection(config)

    onClientConnected(Connection, { config })
    Connection.connect()
}

function formatData (rows, options=null) {
    const result = []

    if (!Array.isArray(rows)) {
        return result
    }

    rows.map(columns=>{
        if (!Array.isArray(columns)) return

        const row = {}

        columns.map(column=>{
            const { metadata, value } = column
            const { colName, dataLength, type } = metadata || {}

            row[colName] = value
        })

        result.push(row)
    })

    return result
}

function initConfig () {
    const config  = dotenv.config()
    const fileEnv = (config.error) ? null : config.parsed

    return (fileEnv && fileEnv.DOTENV) ? fileEnv : process.env
}

function IsDbReady () {
    return dbReady
}

function onClientConnected (Connection, options=null) {
    const { config={} } = options || {}
    const prefix      = name + '::onClientConnected'
    const failOptions = { err: true, prefix }
    const infoOptions = { info: true, prefix }

    if (retry.current < 1) {
        Log('Bind MsSQL events', infoOptions)
    }

    Connection.on('connect', (err)=>{
        const prefix = failOptions.prefix + '@connect'

        if (err) {
            if (retry.current) {
                Log('MSSQL retry connection failure...', { ...failOptions, prefix })
            } else {
                Log('MSSQL connection error 😱', { ...failOptions, prefix })
                ErrorLog(err)
            }

            retry.do(connect)
            return
        }
    
        Log(`MsSQL on "_${config.server}_" connected`, { prefix, success: true })
        dbReady = true
    }).on('error', () => {
        const prefix = failOptions.prefix + '@error'
        Log('MsSQL got internal error occurs 🆘', { ...failOptions, prefix })
    }).on('errorMessage', () => {
        const prefix = failOptions.prefix + '@errorMessage'
        Log('MsSQL server has issued an error message 🆘', { ...failOptions, prefix })
    }).on('infoMessage', info=>{
        // const prefix = infoOptions.prefix + '@infoMessage'
        // console.log({info})
    }).on('end', () => {
        const prefix = failOptions.prefix + '@end'

        dbReady = false
        Log('MsSQL client connection has end! 😯', { ...failOptions, prefix })
    })
}

const MsSQL = {
    connection: (options=null) => {
        if (dbReady && Connection) return Connection

        const { reconnectOnError=true } = options || {}

        if (reconnectOnError) {
            retry.do(connect, { increment: false })
        }

        throw new Error('Connection to MsSQL server is failed')
    },

    execSql: (sql, options=null) => {
        return new Promise((resolve, reject)=>{
            const { getOne=false, reconnectOnError=true, returnCount=false } = options || {}

            if (!dbReady || !Connection || !Connection.execSql) {
                if (reconnectOnError) {
                    retry.do(connect, { increment: false })
                }

                reject(new Error('Connection to MsSQL server is not connected'))
                return
            }

            const request = new tedious.Request(sql, (err, rowCount, rows)=>{
                if (err) {
                    reject(err)
                    return
                }

                const result = formatData(rows)

                if (getOne) {
                    if (rowCount === 0) {
                        resolve({})
                    } else if (rowCount >= 1) {
                        resolve(result[0])
                    }

                    return
                } else if (returnCount) {
                    resolve({ count: rowCount, result })
                    return
                }

                resolve(result)
            })

            Connection.execSql(request)
        })
    },

    isConnected: ()=>{
        return dbReady
    },

    reconnect: ()=>{
        retry.do(connect)
    }
}
const name  = 'MSSQL'
const retry = new Retry({ log: Log, name: 'MSSQL connection' })
let Connection = null
let dbReady    = false

connect()


export {
    Connection,
    IsDbReady,
    MsSQL
}
