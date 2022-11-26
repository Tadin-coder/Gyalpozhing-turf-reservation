const User = require('./../models/userModels.js');
const express = require('express');
const router = express.Router();

// const getAllUsers = async (req, res, next) => {
//   try {
//     const users = await User.find();
//     res.status(200).json({ data: users, status: 'success' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

exports.getAllUsers = function getAllUsers() {
  router.get('/getAllUser', function (req, res) {
    User.find({}, function (err, user) {
      res.render('userDetails', {
        Details: user,
      });
    });
  });
};

const createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    console.log(req.body.name);
    res.json({ data: user, status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json({ data: user, status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body);
    res.json({ data: user, status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id, req.body);
    // res.json({data:  user, status: 'success'})
    res.send('User Deleted Successfully.');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createUser, getUser, updateUser, deleteUser };
