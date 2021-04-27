'use strict'


function _validate (dbReady, options=null) {
    if (!dbReady) {
        throw new Error('Connection to mongoDB server is not connected')
    }

    const { otherChecking=false } = options || {}

    return true
}

const name      = 'PermissionRepo'
const providers = { Log: null, Mongo: null }
const tableName = 'permissions'

const PermissionRepo = {
    driver: 'mongodb',
    name,
    providers,

    repository: providers => ({
        create: async (data, options=null) => {
            const { Log, Mongo } = providers

            try {
                const db = await Mongo.db()

                _validate(Mongo.isConnected)

                const collection = db.collection(tableName)
                const { insertedId, ops, result } = await collection.insertOne(data)

                return (Array.isArray(ops) && ops.length)
                    ? ops[0]
                    : { _id: insertedId, ...data }
            } catch (err) {
                Log(`${name}.create() return error`, { danger: err })
                throw err
            }
        },

        find: async (query, options=null) => {
            const { Log, Mongo } = providers

            try {
                const { findOne=false } = options || {}
                const db = await Mongo.db()

                _validate(Mongo.isConnected)

                const collection = db.collection(tableName)

                if (findOne) {
                    return await collection.findOne(query)
                }

                return await collection.find(query).toArray()
            } catch (err) {
                Log(`${name}.find() return error`, { danger: err })
                throw err
            }
        }
    })
}


export {
    PermissionRepo
}
