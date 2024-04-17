// Define mongoose schema for User
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstName: String,
    lastName: String,
    age: Number,
    occupation: String,
    dob: Date,
    email: String,
    password: String,
    watchlist: {
        type: [String], 
        default: []
    },
    imageUrl: {
        type: [String],
        default: []
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;