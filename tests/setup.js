jest.setTimeout(30000)
require('dotenv').config()
require('../models/User')
const mongoose = require('mongoose')
const keys = require('../config/keys')

mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// This will run after all tests are done 
afterAll(async () => {
  await mongoose.disconnect();
});
