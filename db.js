const mongoose = require("mongoose");
const MONGO_URL = "mongodb://localhost:27017/pidr";

mongoose.connect(MONGO_URL, { useNewUrlParser: true });

module.exports = mongoose.connection;