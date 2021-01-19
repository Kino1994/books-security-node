const mongoose = require('mongoose');
const url = "mongodb://localhost:27017/booksDB";
const User = require('./models/user.js').User;
const Book = require('./models/book.js').Book;


async function connect() {

    await mongoose.connect(url, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: false
    });

    console.log("Connected to Mongo");

    await User.deleteMany({});
}

async function disconnect() {
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB")
}


module.exports = { connect, disconnect }