'use strict'


function _validate (DbReady, options=null) {
    if (!DbReady) {
        throw new Error('Connection to mongoDB server is closed')
    }

    const { otherChecking=false } = options || {}

    return true
}

const name      = 'PermissionRepo'
const providers = { Db: null, DbReady: null }
const tableName = 'permissions'

const PermissionRepo = {
    name,
    providers,

    repository: providers => ({
        create: async (data, options=null) => {
            const { Db, DbReady } = providers

            try {
                _validate(DbReady)

                const collection = Db.collection(tableName)

                const { insertedId, ops, result } = await collection.insertOne(data)

                return (Array.isArray(ops) && ops.length)
                    ? ops[0]
                    : { _id: insertedId, ...data }
            } catch (err) {
                console.log(`${name}.create() return error`)
                throw err
            }
        },

        find: async (query, options=null) => {
            const { Db, DbReady } = providers
            const { findOne=false } = options || {}

            try {
                _validate(DbReady)

                const collection = Db.collection(tableName)

                if (findOne) {
                    return await collection.findOne(query)
                }

                return await collection.find(query).toArray()
            } catch (err) {
                console.log(`${name}.find() return error`)
                throw err
            }
        }
    })
}


export {
    PermissionRepo
}