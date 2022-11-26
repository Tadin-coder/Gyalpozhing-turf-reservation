//jshint esversion:6

const { check, sanitizedBody } = require('express-validator');

const bookValidation = [
  check('date').trim().notEmpty().withMessage('Date is required!'),
  check('time').trim().notEmpty().withMessage('Select the Time!'),
  check('day').trim().notEmpty().withMessage('AM/PM!'),
  check('jrnlNo')
    .trim()
    .notEmpty()
    .withMessage('Please enter the Journal Number')
    .isLength({
      min: 6,
      max: 6,
    })
    .withMessage('Journal number must be 6 characters long'),
];

module.exports = { bookValidation };
