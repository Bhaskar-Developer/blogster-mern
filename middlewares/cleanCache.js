const { clearHash } = require('../services/cache')

module.exports = async (req, res, next) => {
  // wait for route handler/controller to execute then run this middleware
  await next()
  console.log("Clearing out cache")
  clearHash(req.user.id)
}