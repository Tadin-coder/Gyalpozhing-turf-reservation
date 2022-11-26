//jshint esversion:6

const cookie = require('cookie-parser');
const jwt = require('jsonwebtoken');
const User = require('../models/userModels');
const Admin = require('../models/adminModels');

const loginrequired = (req, res, next) => {
  const token = req.cookies;
  console.log('Token: ' + token);
  if (token) {
    const validatetoken = jwt.verify(token, process.env.JWT_SECRET);
    if (validatetoken) {
      res.user = validatetoken._id;
      next();
    } else {
      console.log('token expires');
      res.render('userLogin', { errorMessage: 'You are logout' });
    }
  } else {
    console.log('token not found!');
    res.render('userLogin', { errorMessage: 'Please login' });
  }
};

const verifyEmailAdmin = (req, res, next) => {
  try {
    User.find(function (err, users) {
      if (err) {
        console.log(err);
        res.render('admin/login', {
          errorMessage:
            'Something went wrong, Please try to click your verification link again...',
        });
      } else {
        users.forEach(function (user) {
          if (user.username === req.body.username) {
            if (user.isVerified === true) {
              next();
            } else {
              console.log('Your email is not verified');
              res.render('admin/login', {
                errorMessage: 'Your email is not verified',
              });
            }
          }
        });
      }
    });
  } catch (err) {
    console.log(err);
    res.render('admin/login', {
      errorMessage:
        'Something went wrong, Please try to click your verification link again...',
    });
  }
};

const verifyEmailUser = (req, res, next) => {
  try {
    User.find(function (err, users) {
      if (err) {
        console.log(err);
        res.render('user/userLogin', {
          errorMessage:
            'Something went wrong, Please try to click your verification link again...',
        });
      } else {
        users.forEach(function (user) {
          if (user.username === req.body.username) {
            if (user.isVerified === true) {
              next();
            } else {
              console.log('Your email is not verified');
              res.render('user/userLogin', {
                errorMessage: 'Your email is not verified',
              });
            }
          }
        });
      }
    });
  } catch (err) {
    console.log(err);
    res.render('user/userLogin', {
      errorMessage:
        'Something went wrong, Please try to click your verification link again...',
    });
  }
};

module.exports = { loginrequired, verifyEmailUser, verifyEmailAdmin };
