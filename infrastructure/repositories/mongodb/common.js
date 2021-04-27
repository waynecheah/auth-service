'use strict'


function _validate (dbReady, options=null) {
    if (!dbReady) {
        throw new Error('Connection to mongoDB server is not connected')
    }

    const { otherChecking=false } = options || {}

    return true
}

const name      = 'CommonRepo'
const providers = { ApiError: null, Mongo: null, Log: null }

const CommonRepo = {
    driver: 'mongodb',
    name,
    providers,

    repository: providers => ({
        create: async (collectionName, data, options=null) => {
            const { Log, Mongo } = providers

            try {
                const { dbOptions=null, summary=false } = options || {}
                const db = await Mongo.db()

                _validate(Mongo.isConnected())

                const collection = db.collection(collectionName)

                if (Array.isArray(data)) {
                    const {
                        connection, insertedCount, insertedIds, ops, result
                    } = await collection.insertMany(data, dbOptions)
                    const { n, ok } = result

                    if (summary) return { insertedCount, insertedIds, ok }

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
                Log(`${name}.create() return error`, { danger: err })
                throw err
            }
        },

        delete: async (collectionName, filter, options=null) => {
            const { Log, Mongo } = providers

            try {
                const { dbOptions=null, deleteOne=true } = options || {}
                const db = await Mongo.db()

                _validate(Mongo.isConnected())

                const collection = db.collection(collectionName)

                const {
                    connection, deletedCount, result
                } = (deleteOne)
                    ? await collection.deleteOne(filter, dbOptions)
                    : await collection.deleteMany(filter, dbOptions)
                const { n, ok } = result

                return { deletedCount }
            } catch (err) {
                Log(`${name}.delete() return error`, { danger: err })
                throw err
            }
        },

        find: async (collectionName, query, options=null) => {
            const { Log, Mongo } = providers

            try {
                const { findOne=false, projection=null } = options || {}
                const db = await Mongo.db()

                _validate(Mongo.isConnected())

                const collection = db.collection(collectionName)

                if (findOne) {
                    return await collection.findOne(query, { projection })
                }

                return await collection.find(query, { projection }).toArray()
            } catch (err) {
                Log(`${name}.find() return error`, { danger: err })
                throw err
            }
        },

        findById: async (collectionName, id, options=null) => {
            const { ApiError, Log, Mongo } = providers

            try {
                const { projection=null } = options || {}
                const db = await Mongo.db()

                _validate(Mongo.isConnected())

                if (!Mongo.isValidID(id)) {
                    throw new ApiError({
                        code: 'INVALID_OBJECT_ID',
                        status: 400
                    }, `Invalid id - ${id}`)
                }

                const collection = db.collection(collectionName)
                const query      = {
                    _id: Mongo.objectID(id)
                }

                return await collection.findOne(query, { projection })
            } catch (err) {
                Log(`${name}.findById() return error`, { danger: err })
                throw err
            }
        },

        update: async (collectionName, filter, data, options=null) => {
            const { Log, Mongo } = providers

            try {
                const { dbOptions=null, updateOne=true } = options || {}
                const db = await Mongo.db()

                _validate(Mongo.isConnected())

                const collection = db.collection(collectionName)
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
                Log(`${name}.update() return error`, { danger: err })
                throw err
            }
        }
    })
}


export {
    CommonRepo
}
