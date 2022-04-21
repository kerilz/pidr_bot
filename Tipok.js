const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tipokSchema = new Schema({
    name: String,
    userId: Number,
    length: Number,
    lastPlayed: Date,
    groupId: String
});

module.exports = mongoose.model("Tipok", tipokSchema);