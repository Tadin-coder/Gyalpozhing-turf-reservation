const express = require('express');
const { appendFile, rmSync } = require('fs');
const Admin = require('../models/adminModels');
const User = require('../models/userModels');
const router = express.Router();
const app = express();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const registerValidation = require('../validator/registerValidation');
const loginValidation = require('../validator/loginValidation');
const { validationResult, matchedData } = require('express-validator');
const nodemailer = require('nodemailer');
const {
  loginrequired,
  verifyEmailAdmin,
  verifyEmailUser,
} = require('../config/JWT');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(express.json());

router.get('/', function (req, res) {
  res.render('home');
});

//Admin Routes
router.get('/adminRegister', function (req, res) {
  res.render('adminRegister');
});

router.get('/admin', function (req, res) {
  res.render('admin');
});

router.get('/adminPage', function (req, res) {
  res.render('adminPage');
});

router.get('/', function (req, res) {
  res.render('userpage');
});

//User Routes
router.get('/userRegister', function (req, res) {
  res.render('userRegister');
});

router.get('/userLogin', function (req, res) {
  res.render('userLogin');
});

router.put('/:id');

router.get('/adminget', function (req, res) {
  res.render('adminget');
});

//mail sender
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

router.get('/logout', function (req, res, next) {
  res.cookie('access_token', '', {
    maxAge: 1,
  });
  res.redirect('/userLogin');
});

const createToken = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET
  );
};

const usersList = [];

//Admin Routes
//Registration
router.post('/adminRegister', registerValidation, function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var errMsg = errors.mapped();
      var inputData = matchedData(req);
      res.render('register', {
        errors: errMsg,
        inputData: inputData,
      });
    } else {
      Admin.findOne(
        {
          email: req.body.email,
        },
        function (err, foundUser) {
          if (err) {
            res.render('adminRegister', {
              errorMessage: err,
            });
          } else if (foundUser) {
            res.render('adminRegister', {
              errorMessage:
                'This email is already being Used. Please try with different email.',
            });
          } else {
            bcrypt.hash(req.body.password, 10, function (err, hash) {
              const user = new Admin({
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                password: hash,
                emailToken: crypto.randomBytes(64).toString('hex'),
                isVerified: true,
              });
              user.save(function (err) {
                if (err) {
                  console.log(err);
                } else {
                  link =
                    'http://' +
                    req.headers.host +
                    '/verify-email?token=' +
                    user.emailToken;
                  var mailOptions = {
                    from: 'Gyalpozhing Turf Reservation',
                    to: user.email,
                    subject: 'Gyalpozhing Turf Reservation - verify your email',
                    html:
                      '<h2>Hello ' +
                      req.body.name +
                      ', Thanks for being with us.</h2><h4> Kindly verify your email to continue...</h4><a href=' +
                      link +
                      '>Verify your Email</a>',
                  };

                  //sending mail
                  transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                      console.log('email' + error);
                    } else {
                      console.log(
                        'Verification link is sent to your gmail account'
                      );
                      res.render('admin', {
                        successMessage:
                          'Verification link is sent to your gmail account',
                      });
                    }
                  });
                }
              });
            });
          }
        }
      );
    }
  } catch (err) {
    console.log('Verification Invalid' + err);
    res.render('register', {
      errorMessage: 'Something went wrong, Please try again!',
    });
  }
});

//Login
// router.post(
//   '/adminLogin',
//   loginValidation,
//   verifyEmailAdmin,
//   function (req, res) {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       var errMsg = errors.mapped();
//       var inputData = matchedData(req);
//       res.render('admin', {
//         errors: errMsg,
//         inputData: inputData,
//       });
//     } else {
//       const email = req.body.email;
//       const password = req.body.password;
//       Admin.findOne(
//         {
//           email: email,
//         },
//         function (err, foundUser) {
//           if (err) {
//             console.log(err);
//             res.render('admin', {
//               errorMessage: err,
//             });
//           } else if (foundUser) {
//             bcrypt.compare(
//               password,
//               foundUser.password,
//               function (err, result) {
//                 if (result === true) {
//                   const token = createToken(foundUser._id);
//                   //store token in cookies
//                   res.cookie('access_token', token);
//                   res.render('adminPage');
//                 } else {
//                   res.render('admin', {
//                     errorMessage: 'Your password is incorrect!',
//                   });
//                 }
//               }
//             );
//           } else {
//             res.render('admin', {
//               errorMessage: 'No such User found!',
//             });
//           }
//         }
//       );
//     }
//   }
// );

//User Routes
router.post('/userRegister', registerValidation, function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var errMsg = errors.mapped();
      var inputData = matchedData(req);
      res.render('userRegister', {
        errors: errMsg,
        inputData: inputData,
      });
    } else {
      User.findOne(
        {
          email: req.body.email,
        },
        function (err, foundUser) {
          if (err) {
            res.render('userRegister', {
              errorMessage: err,
            });
          } else if (foundUser) {
            res.render('userRegister', {
              errorMessage:
                'This email is already used by another person. Please try with different email.',
            });
          } else {
            bcrypt.hash(req.body.password, 10, function (err, hash) {
              const user = new User({
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                password: hash,
                emailToken: crypto.randomBytes(64).toString('hex'),
                isVerified: true,
              });
              user.save(function (err) {
                if (err) {
                  console.log(err);
                } else {
                  link =
                    'http://' +
                    req.headers.host +
                    '/verify-email?token=' +
                    user.emailToken;
                  var mailOptions = {
                    from: 'Gyalpozhing Turf Reservation',
                    to: user.email,
                    subject: 'Gyalpozhing Turf Reservation - verify your email',
                    html:
                      '<h2>Hello ' +
                      req.body.name +
                      ', Thanks for being with us.</h2><h4> Kindly verify your email to continue...</h4><a href=' +
                      link +
                      '>Verify your Email</a>',
                  };

                  //sending mail
                  transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                      console.log('email' + error);
                    } else {
                      console.log(
                        'Verification link is sent to your gmail account'
                      );
                      res.render('userLogin', {
                        successMessage:
                          'Verification link is sent to your gmail account',
                      });
                    }
                  });
                }
              });
            });
          }
        }
      );
    }
  } catch (err) {
    console.log('Verification Invalid' + err);
    res.render('userRegister', {
      errorMessage: 'Something went wrong, Please try again!',
    });
  }
});

router.post(
  '/userLogin',
  loginValidation,
  verifyEmailUser,
  function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var errMsg = errors.mapped();
      var inputData = matchedData(req);
      res.render('userLogin', {
        errors: errMsg,
        inputData: inputData,
      });
    } else {
      const email = req.body.email;
      const password = req.body.password;
      User.findOne(
        {
          email: email,
        },
        function (err, foundUser) {
          if (err) {
            console.log(err);
            res.render('userLogin', {
              errorMessage: err,
            });
          } else if (foundUser) {
            bcrypt.compare(
              password,
              foundUser.password,
              function (err, result) {
                if (result === true) {
                  const token = createToken(foundUser._id);

                  //store token in cookies
                  res.cookie('access_token', token);
                  res.render('userpage', {
                    user: foundUser,
                  });
                } else {
                  res.render('userLogin', {
                    errorMessage: 'Your password is incorrect!',
                  });
                }
              }
            );
          } else {
            res.render('userLogin', {
              errorMessage: 'No such User found!',
            });
          }
        }
      );
    }
  }
);

router.get('/verify-email', function (req, res) {
  try {
    const token = req.query.token;
    const user = User.findOne({
      emailToken: token,
    });
    if (user) {
      user.updateOne(
        {
          isVerified: true,
        },
        function (err) {
          if (err) {
            res.render('userLogin', {
              errorMessage: err,
            });
          } else {
            res.render('userLogin', {
              successMessage:
                'Your Email has been successfully verified, Please login to continue...',
            });
          }
        }
      );
    } else {
      res.render('userRegister', {
        errorMessage: 'Something went wrong, Please try with different gmail!',
      });
    }
  } catch (err) {
    console.log('Verification Failed here ' + err);
    res.render('UserLogin', {
      errorMessage: err,
    });
  }
});

//...........Retrieving Data.......................................................

//Get Admin Details
router.get('/adminDetails', function (req, res) {
  Admin.find({}, function (err, admin) {
    res.render('adminDetails', {
      Details: admin,
    });
  });
});

//........................edit........................................
router.get('/adminUpdate/:id', function (req, res) {
  Admin.findById(req.params.id, function (err, result) {
    res.render('adminUpdate', { admin: result });
  });
});

//.....................UPDATE..........................................
router.post('/adminupdate/:id', async function (req, res) {
  await Admin.findByIdAndUpdate(req.params.id, req.body);
  res.redirect('/adminDetails');
});

//..............delete................................................
router.get('/delete/:id', async function (req, res) {
  await Admin.findByIdAndDelete(req.params.id);
  res.redirect('/adminDetails');
});

//Admin on Users
//........................edit........................................
router.get('/userUpdate/:id', function (req, res) {
  User.findById(req.params.id, function (err, result) {
    res.render('userUpdate', { user: result });
  });
});

//.....................UPDATE..........................................
router.post('/userupdate/:id', async function (req, res) {
  await User.findByIdAndUpdate(req.params.id, req.body);
  res.redirect('/userDetails');
});

//..............delete................................................
router.get('/deleteuser/:id', async function (req, res) {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/userDetails');
});

//Get User Details

router.get('/userDetails', function (req, res) {
  console.log(req.user);
  User.find({}, function (err, user) {
    res.render('userDetails', {
      Details: user,
    });
  });
});

//........................edit........................................
router.get('/userUpdate1/:id', function (req, res) {
  User.findById(req.params.id, function (err, result) {
    res.render('userUpdate1', { user: result });
  });
});

//.....................UPDATE..........................................
router.post('/userupdate1/:id', async function (req, res) {
  await User.findByIdAndUpdate(req.params.id, req.body);
  res.redirect('userUpdate1');
});

module.exports = router;
