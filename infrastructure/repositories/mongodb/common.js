'use strict'
import mongodb from 'mongodb'


function _validate (DbReady, options=null) {
    if (!DbReady) {
        throw new Error('Connection to mongoDB server is closed')
    }

    const { otherChecking=false } = options || {}

    return true
}

const name      = 'CommonRepo'
const providers = { ApiError: null, Db: null, DbReady: null }

const CommonRepo = {
    name,
    providers,

    repository: providers => ({
        create: async (collectionName, data, options=null) => {
            try {
                const { Db, DbReady } = providers
                const { dbOptions=null } = options || {}

                _validate(DbReady)

                const collection = Db.collection(collectionName)

                if (Array.isArray(data)) {
                    const {
                        connection, insertedCount, insertedIds, ops, result
                    } = await collection.insertMany(data, dbOptions)
                    const { n, ok } = result

                    if (Array.isArray(ops) && ops.length) return ops

                    if (Array.isArray(insertedIds)) {
                        return data.map((itm, index) => {
                            const _id = insertedIds[index]

                            return (_id) ? { _id, ...itm } : itm
                        })
                    }

                    return data
                }

                const {
                    connection, insertedCount, insertedId, ops, result
                } = await collection.insertOne(data, dbOptions)
                const { n, ok } = result

                return (Array.isArray(ops) && ops.length)
                    ? ops[0]
                    : { _id: insertedId, ...data }
            } catch (err) {
                console.log(`${name}.create() return error`)
                throw err
            }
        },

        delete: async (collectionName, filter, options=null) => {
            try {
                const { Db, DbReady } = providers
                const { dbOptions=null, deleteOne=true } = options || {}

                _validate(DbReady)

                const collection = Db.collection(collectionName)

                const {
                    connection, deletedCount, result
                } = (deleteOne)
                    ? await collection.deleteOne(filter, dbOptions)
                    : await collection.deleteMany(filter, dbOptions)
                const { n, ok } = result

                return { deletedCount }
            } catch (err) {
                console.log(`${name}.delete() return error`)
                throw err
            }
        },

        find: async (collectionName, query, options=null) => {
            try {
                const { Db, DbReady } = providers
                const { findOne=false, projection=null } = options || {}

                _validate(DbReady)

                const collection = Db.collection(collectionName)

                if (findOne) {
                    return await collection.findOne(query, { projection })
                }

                return await collection.find(query, { projection }).toArray()
            } catch (err) {
                console.log(`${name}.find() return error`)
                throw err
            }
        },

        findById: async (collectionName, id, options=null) => {
            try {
                const { ApiError, Db, DbReady } = providers
                const { projection=null } = options || {}

                _validate(DbReady)

                if (!mongodb.ObjectID.isValid(id)) {
                    throw new ApiError({
                        code: 'INVALID_OBJECT_ID',
                        status: 400
                    }, `Invalid id - ${id}`)
                }

                const collection = Db.collection(collectionName)
                const query      = {
                    _id: new mongodb.ObjectID(id)
                }

                return await collection.findOne(query, { projection })
            } catch (err) {
                console.log(`→ ${name}.findById() return error`)
                throw err
            }
        },

        update: async (collectionName, filter, data, options=null) => {
            try {
                const { Db, DbReady } = providers
                const { dbOptions=null, updateOne=true } = options || {}

                _validate(DbReady)

                const collection = Db.collection(collectionName)
                const {
                    matchedCount, message, modifiedCount, ops, result, upsertedId, upsertedCount
                } = (updateOne)
                    ? await collection.updateOne(filter, { $set: data }, dbOptions)
                    : await collection.updateMany(filter, data, dbOptions)
                const { n, nModified, ok } = result

                return {
                    ok, matchedCount, modifiedCount
                }
            } catch (err) {
                console.log(`${name}.update() return error`)
                throw err
            }
        }
    })
}


export {
    CommonRepo
}
