const mongoose = require("mongoose");

const connect = mongoose.connect('mongodb+srv://Samarth:bidaye@cluster0.bag0e.mongodb.net/mini_project?retryWrites=true&w=majority&appName=Cluster0');

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    posts: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'post' }
    ]
});

module.exports = mongoose.model('user', userSchema);