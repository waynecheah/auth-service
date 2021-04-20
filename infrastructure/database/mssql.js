'use strict'
import tedious from 'tedious'


const { MSSQL_DATABASE, MSSQL_HOST, MSSQL_PASSWORD, MSSQL_USERNAME } = process.env
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
const connection = new tedious.Connection(config)
let dbReady = false

connection.on('connect', (err)=>{
    if (err) {
        console.log('Error: ', err)
        return
    }

    console.log(`MsSQL on ${config.server} connected`)
    dbReady = true
})

// connection.connect()


export {
    connection,
    dbReady
}
