const { check, sanitizedBody } = require('express-validator');

const forgotValidation = [
  check('username')
    .notEmpty()
    .withMessage('Email Address is required!')
    .normalizeEmail()
    .isEmail()
    .withMessage('Email address must be valid'),
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required!')
    .isLength({
      min: 8,
    })
    .withMessage('Password must be minimum 8 characters long')

    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('your password should have at least one sepcial character'),
  //Confirm password validation

  check('confirmPassword').custom(async (confirmPassword, { req }) => {
    const password = req.body.password;

    if (password !== confirmPassword) {
      throw new Error('Password must be same.');
    }
  }),
];

module.exports = forgotValidation;
