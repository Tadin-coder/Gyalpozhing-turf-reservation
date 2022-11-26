//jshint esversion:6
const nodemailer = require('nodemailer');

//mail sender details
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.auth_user,
    pass: process.env.auth_pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = { transporter };
