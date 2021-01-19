const mongoose = require('mongoose');
const Comment = require('./comment.js');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is mandatory']
    },
    summary: String,
    author: {
        type: String,
        required: [true, 'Author is mandatory']
    },
    publisher: {
        type: String,
        required: [true, 'Publisher is mandatory']
    },
    publicationYear: {
        type: Number,
        validate: {
            validator: function (publicationYear) {
                return Number.isInteger(publicationYear) && publicationYear > 0;
            },
            message: props => `${props.value} is not a valid publication year`
        },
        required: [true, 'Publication year is mandatory']
    },
    comments: [Comment.commentSchema]
});

const Book = mongoose.model('Book', bookSchema);

function toResponse(document) {

    if (document instanceof Array) {
        return document.map(elem => JSON.parse('{"id": "' + elem._id.toString() + '","title": "' + elem.title.toString() + '"}'));
    } else {
        let response = document.toObject({ versionKey: false });
        response.id = response._id.toString();
        response.comments = Comment.toResponse(document.comments)
        delete response._id;
        return response;
    }
}

module.exports = { Book, toResponse }
