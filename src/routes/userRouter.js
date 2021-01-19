const express = require('express');
const router = express.Router();
const { User, toResponse, isValidEmail, userSchema } = require('../models/user.js');
const Book = require('../models/book.js').Book;
const mongoose = require('mongoose');

const INVALID_USER_ID_RESPONSE = { "error": "Invalid user id" };
const USER_NOT_FOUND_RESPONSE = { "error": "User not found" };

var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require('../config');

router.get('/', async (req, res) => {

    const allUsers = await User.find().exec();
    res.json(toResponse(allUsers));
});

router.post('/', async (req, res) => {

    var hashedPassword = bcrypt.hashSync(req.body.password, 8);
    
    User.create({
        nick : req.body.nick,
        email : req.body.email,
        password : hashedPassword
    },
    function (err, user) {
        if (err) return res.status(500).send("There was a problem registering the user.")
        // create a token
            var token = jwt.sign({ id: user._id }, config.secret, {
                expiresIn: 86400 // expires in 24 hours
            });
            res.status(200).send({ auth: true, token: token });
    });
});


router.get('/:nick', async (req, res) => {

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

    const user = await User.find({ nick: req.params.nick }).exec();

    if (!user){
        return res.status(404).send('No user found.');
    }

    res.json(toResponse(user));

});

router.put('/:nick', async (req, res) => {

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
    
    let user = await User.findOneAndDelete({ nick: req.params.nick }).exec();

    if (!user){
        return res.status(404).send('No user found.');
    }

    user = new User({
        nick: req.body.nick,
        email: req.body.email,
        password : bcrypt.hashSync(req.body.password, 8)
    });

    await user.save();

    res.status(202).json(toResponse(user));

});

router.delete('/:nick', async (req, res) => {

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
    
    let user = await User.findOneAndDelete({ nick: req.params.nick }).exec();

    if (!user){
        return res.status(404).send('No user found.');
    }

    res.status(202).json(toResponse(user));
});

router.get('/:nick/comments', async (req, res) => {

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

    let user = await User.findOne({ nick: req.params.nick }).exec();

    if (!user){
        return res.status(404).send('No user found.');
    }

    const userComments = await Book.aggregate([
        { $unwind: "$comments" },
        { $match: { "comments.user": user._id } },
        {
            $project: {
                "_id": 0,
                "id": "$comments._id",
                "bookId": "$_id",
                "comment": "$comments.comment",
                "score": "$comments.score"
            }
        },
    ]);

    res.json(userComments);

});

module.exports = router;