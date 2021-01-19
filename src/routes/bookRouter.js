const express = require('express');
const router = express.Router();
const { Book, toResponse: toResponseBook } = require('../models/book.js');
const User = require('../models/user.js').User;
const toResponseComment = require('../models/comment.js').toResponse;
const mongoose = require('mongoose');

const INVALID_BOOK_ID_RESPONSE = { "error": "Invalid book id" };
const BOOK_NOT_FOUND_RESPONSE = { "error": "Book not found" }

var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require('../config');

router.get('/', async (req, res) => {
    const allBooks = await Book.find().exec();
    res.json(toResponseBook(allBooks));
});

router.get('/:id', async (req, res) => {

    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
            User.findById(decoded.id,
                { password: 0 }, // projection
            function (err, user) {
                if (err)
                    return res.status(500).send("There was a problem finding the user.");
                if (!user)
                    return res.status(404).send("No user found.");
            });
        });


    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send(INVALID_BOOK_ID_RESPONSE);
    }

    //If nick and name is placed in the comment, there is no need to populate.
    const book = await Book.findById(id).populate('comments.user');
    
    if (!book) {
        return res.status(404).send(BOOK_NOT_FOUND_RESPONSE);
    }

    res.json(toResponseBook(book));
});

router.post('/', async (req, res) => {

    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
            User.findById(decoded.id,
                { password: 0 }, // projection
            function (err, user) {
                if (err)
                    return res.status(500).send("There was a problem finding the user.");
                if (!user)
                    return res.status(404).send("No user found.");
            });
        });


        const book = new Book({
            title: req.body.title,
            summary: req.body.summary,
            author: req.body.author,
            publisher: req.body.publisher,
            publicationYear: req.body.publicationYear,
        });
    
        await book.save()
            .then(savedBook => res.json(toResponseBook(savedBook)))
            .catch(error => {
                console.log(error);
                res.status(400).send(error);
            });

});

router.put('/:id', async (req, res) => {

    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
            User.findById(decoded.id,
                { password: 0 }, // projection
            function (err, user) {
                if (err)
                    return res.status(500).send("There was a problem finding the user.");
                if (!user)
                    return res.status(404).send("No user found.");
            });
        });

    let newBook = await Book.findOneAndDelete({ nick: req.params.nick }).exec();

    if (!newBook){
        return res.status(404).send('No user found.');
    }

    newBook = new Book({
        title: req.body.title,
        summary: req.body.summary,
        author: req.body.author,
        publisher: req.body.publisher,
        publicationYear: req.body.publicationYear,
    });

    await newBook.save();

    res.status(202).json(newBook);

});

router.delete('/:id', async (req, res) => {

    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
            User.findById(decoded.id,
                { password: 0 }, // projection
            function (err, user) {
                if (err)
                    return res.status(500).send("There was a problem finding the user.");
                if (!user)
                    return res.status(404).send("No user found.");
            });
        });
    
        let newBook = await Book.findOneAndDelete({ nick: req.params.nick }).exec();

        if (!newBook){
            return res.status(404).send('No user found.');
        }
        
        res.status(202).json(newBook);

 
});




router.post('/:id/comments', async (req, res) => {

    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
            User.findById(decoded.id,
                { password: 0 }, // projection
            function (err, user) {
                if (err)
                    return res.status(500).send("There was a problem finding the user.");
                if (!user)
                    return res.status(404).send("No user found.");
            });
        });


    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send(INVALID_BOOK_ID_RESPONSE);
    }
    if (!req.body.userNick) {
        return res.status(400).send({ "error": "User nick is mandatory" });
    }

    const book = await Book.findById(id);
    if (!book) {
        return res.status(404).send(BOOK_NOT_FOUND_RESPONSE);
    }

    const user = await User.findOne({ nick: req.body.userNick })
    if (!user) {
        return res.status(404).json({ "error": "User not found" });
    };

    book.comments.push({
        comment: req.body.comment,
        score: req.body.score,
        user: user._id
    });

    await book.save()
        .then(async savedBook => {
            await savedBook.populate(['comments', savedBook.comments.length - 1, 'user'].join('.')).execPopulate();
            const comment = savedBook.comments[savedBook.comments.length - 1];
            res.json(toResponseComment(comment));
        })
        .catch(error => {
            console.log(error);
            res.status(400).send(error);
        });

});


router.delete('/:id/comments/:commentId', async (req, res) => {

    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
            User.findById(decoded.id,
                { password: 0 }, // projection
            function (err, user) {
                if (err)
                    return res.status(500).send("There was a problem finding the user.");
                if (!user)
                    return res.status(404).send("No user found.");
            });
        });


    const id = req.params.id;
    const commentId = req.params.commentId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send(INVALID_BOOK_ID_RESPONSE);
    }
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).send({ "error": "Invalid comment id" });
    }

    const book = await Book.findById(id).populate('comments.user');
    if (!book) {
        return res.status(404).send(BOOK_NOT_FOUND_RESPONSE);
    }

    const comment = await book.comments.id(commentId);
    if (!comment) {
        return res.status(404).send({ "error": "Comment not found" });
    }

    comment.remove();
    await book.save();
    res.json(toResponseComment(comment));

});

module.exports = router;