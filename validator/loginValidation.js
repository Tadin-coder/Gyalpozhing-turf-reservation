const { check, sanitizedBody } = require('express-validator');

const loginValidation = [
  //Email || email validation
  check('username')
    .trim()
    .notEmpty()
    .withMessage('Email Address is required!')
    .normalizeEmail()
    .isEmail()
    .withMessage('Email address must be valid'),
  //Password validation
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required!')
    .isLength({
      min: 8,
    })
    .withMessage('Password must be minimum 5 characters long'),
];

module.exports = loginValidation;
