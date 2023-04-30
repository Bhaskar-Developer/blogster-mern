const mongoose = require('mongoose')
const redis = require('redis')
const util = require('util')
const keys = require('../config/keys')

const client = redis.createClient(keys.redisUrl)
client.hget = util.promisify(client.hget) //Promisify get on client to be able to use await and avoid using callback function


// reference to exec function
const exec = mongoose.Query.prototype.exec;


// create cache function on mongoose
mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true //set a new field on Query instance that will identify if query needs to be cached
  // to make sure function chaining works we return the instance of Query
  // Eg: chaining Query.cache().sort().limit() => here cache, sort and limit are chained to query

  // use this key received as the hash key or if not specified then use empty string. This will be used to generate nested hash
  // Note : This will work for this application because there is no link/dependency between two different individual user blogs i.e. a user will only ever see his/her own blog and not other users blog
  this.hashKey = JSON.stringify(options.key || '')
  return this
}


mongoose.Query.prototype.exec = async function () {
  // check if caching is needed
  if (!this.useCache) {
    return exec.apply(this, arguments)
  }

  const key = JSON.stringify(Object.assign({}, this.getQuery(), {
    collection: this.mongooseCollection.name
  }))

  // see if we have a value for key in redis
  const cacheValue = await client.hget(this.hashKey, key)

  // if we do, then return that
  if (cacheValue) {
    console.log("Getting data from cache")
    const doc = JSON.parse(cacheValue)

    // Mongoose will return a single object or array of object based on query
    // If a single object is returned then just assign it to the model or hydrate the model
    // If its an array then run a loop and hydrate model with each elements
    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc)
  }

  // otherwise, issue the query and store the result in redis
  const result = await exec.apply(this, arguments)

  // turn result to json to store in cache
  client.hset(this.hashKey, key, JSON.stringify(result))

  // return mongoose model documents for further processing in controllers 
  console.log("Getting Data from MongoDB")
  return result
}

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey))
  }
}