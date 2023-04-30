const mongoose = require('mongoose')
const User = mongoose.model('User')

module.exports = () => {
    // User model has fields displayName, googleId, but these fields are not used anywhere in the application, so we dont add these fields on the user when creating
    return new User({}).save()
}