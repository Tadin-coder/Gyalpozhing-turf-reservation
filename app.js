const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passportLocalMongoose = require('passport-local-mongoose');
const User = require('./models/userModels');
const Admin = require('./models/adminModels');
const { bookValidation } = require('./validator/bookingValidation');
const Booking = require('./models/bookingModels');
const Feedback = require('./models/feedbackModels');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const multer = require('multer');
const path = require('path');
const app = express();
app.use(express.json());
const passport = require('passport');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const registerValidation = require('./validator/registerValidation');
const changeValidation = require('./validator/changeValidation');
const loginValidation = require('./validator/loginValidation');
const forgotValidation = require('./validator/forgotValidation');
const { validationResult, matchedData } = require('express-validator');
const nodemailer = require('nodemailer');
const { verifyEmailAdmin, verifyEmailUser } = require('./config/JWT');
const e = require('express');
const { eq } = require('lodash');
const { check, sanitizedBody } = require('express-validator');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(
  session({
    secret: 'Our little secret',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const DB = process.env.DATABASE.replace(
  'PASSWORD',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then((con) => {
    console.log('DB connection successful');
  })
  .catch((error) => console.log(error));

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

app.get('/', function (req, res) {
  res.render('user/landing', { currentUser: req.user });
  console.log(req.user);
});

const error = [];

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//....................................................Contact US.........................................................//
const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/userlogin');
  }
};

const aisLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/admin');
  }
};

const message = [];

app.get('/contact', function (req, res) {
  res.render('user/contact', { currentUser: req.user, message: message });
});

app.post('/contact', function (req, res) {
  const newFeedback = new Feedback({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    subject: req.body.subject,
    details: req.body.details,
  });
  newFeedback.save(function (err, succ) {
    if (err) {
      console.log(err);
    } else {
      const msg = 'Succesfullly submiteed the feedback';
      message.push(msg);
      res.redirect('/');
    }
  });
});

///Admin .......................................................................
app.get('/admin', function (req, res) {
  res.render('admin/login');
});

app.get('/verify-email', function (req, res) {
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
            res.render('user/userLogin', {
              errorMessage: err,
            });
          } else {
            res.render('user/userLogin', {
              successMessage:
                'Your Email has been successfully verified, Please login to continue...',
            });
          }
        }
      );
    } else {
      res.render('user/userRegister', {
        errorMessage: 'Something went wrong, Please try with different gmail!',
      });
    }
  } catch (err) {
    console.log('Verification Failed here ' + err);
    res.render('login', {
      errorMessage: err,
    });
  }
});

app.post('/adminLogin', loginValidation, verifyEmailAdmin, function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var errMsg = errors.mapped();
    var inputData = matchedData(req);
    res.render('admin', { errors: errMsg, inputData: inputData });
  } else {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });
    User.findOne({ username: req.body.username }, function (err, foundUser) {
      if (err) {
        res.render('admin/login', { errorMessage: err });
      } else if (foundUser.isAdmin === true) {
        req.login(user, function (err) {
          if (err) {
            console.log(err);
          } else {
            passport.authenticate('local')(req, res, function () {
              res.redirect('/dashboard');
            });
          }
        });
      } else {
        res.render('admin/login', { errorMessage: 'No user Found!!' });
      }
    });
  }
});
//User .........................................................................

app.get('/userRegister', function (req, res) {
  res.render('user/userRegister', { currentUser: req.user });
});

app.get('/userlogin', function (req, res) {
  res.render('user/userLogin', { currentUser: req.user });
});

app.get('/userpage', function (req, res) {
  res.render('userpage', { currentUser: req.user });
});

//User Register.......................................................................................................
app.post('/userRegister', registerValidation, function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var errMsg = errors.mapped();
      var inputData = matchedData(req);
      res.render('user/userRegister', {
        errors: errMsg,
        inputData: inputData,
        error: error,
        currentUser: req.user,
      });
    } else {
      User.register(
        {
          name: req.body.name,
          username: req.body.username,
          phone: req.body.phone,
          emailToken: crypto.randomBytes(64).toString('hex'),
          isVerified: false,
        },
        req.body.password,
        function (err, user) {
          if (err) {
            error.push(err);
            console.log(error);
            res.render('user/userRegister', {
              currentUser: req.user,
              error: error,
            });
          } else {
            link =
              'http://' +
              req.headers.host +
              '/verify-email?token=' +
              user.emailToken;
            var mailOptions = {
              from: 'Gyalpozhing Turf Reservation',
              to: user.username,
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
                console.log('Verification link is sent to your gmail account');
                res.render('user/userLogin', {
                  successMessage:
                    'Verification link is sent to your gmail account',
                  currentUser: req.user,
                });
              }
            });
            // res.redirect('/');
          }
        }
      );
    }
  } catch (err) {
    console.log('Verification Invalid!!' + err);
    res.render('register', { erroMessage: 'Something wrong' });
  }
});

// User Login ........................................................................................................
app.post('/login', loginValidation, verifyEmailUser, function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var errMsg = errors.mapped();
    var inputData = matchedData(req);
    res.render('user/userLogin', {
      errors: errMsg,
      inputData: inputData,
      currentUser: req.user,
    });
  } else {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });
    User.findByUsername(req.body.username, (err, foundUser) => {
      if (err) {
        res.render('user/userLogin', {
          errorMessage: err,
          currentUser: req.user,
        });
      } else if (foundUser) {
        req.login(user, function (err) {
          if (err) {
            error.push(err);
            res.render('user/userLogin', {
              currentUser: req.user,
              errorMessage: error,
            });
          } else {
            passport.authenticate('local')(req, res, function () {
              res.redirect('/');
            });
          }
        });
      } else {
        res.render('user/userLogin', {
          errorMessage: 'No user Found!!',
          currentUser: req.user,
        });
      }
    });
  }
});

app.get('/userUpdate', function (req, res) {
  res.render('user/userUpdate', { currentUser: req.user });
});

app.post('/userUpdate/:id', async function (req, res) {
  await User.findByIdAndUpdate(req.params.id, req.body);
  res.redirect('/');
});

//..............................................................Schedule Page..................................................//

app.get('/schedule', function (req, res) {
  Booking.find()
    .sort({ createdAt: -1 })
    .exec(function (err, foundRecord) {
      if (err) {
        console.log(err);
      } else {
        res.render('user/schedule', {
          foundRecord: foundRecord,
          currentUser: req.user,
        });
      }
    });
});

//Reservation
app.get('/bookingForm', function (req, res) {
  if (req.isAuthenticated()) {
    res.render('user/bookingForm', { currentUser: req.user });
  } else {
    res.redirect('/userLogin');
  }
});

///......................................................Admin crud operation on Users ...........................................//
app.get('/dashboard', function (req, res) {
  if (req.isAuthenticated()) {
    User.find({}, function (err, user) {
      res.render('admin/dashboard', {
        Details: user,
        currentUser: req.user,
      });
    });
  } else {
    res.redirect('/admin');
  }
});

//........................edit........................................
app.get('/update/:id', function (req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.params.id, function (err, result) {
      res.render('admin/userUpdate', { user: result, currentUser: req.user });
    });
  } else {
    res.redirect('/admin');
  }
});

//.....................UPDATE..........................................
app.post('/adminUpdate/:id', async function (req, res) {
  if (req.isAuthenticated()) {
    await User.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/dashboard');
  }
});

//........................Delete User ...........................................
app.get('/deleteuser/:id', async function (req, res) {
  if (req.isAuthenticated()) {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard');
  } else {
    res.redirect('/admin');
  }
});

//..........................Make ADmin..................................//
app.post('/makeAdmin', function (req, res) {
  if (req.isAuthenticated()) {
    var submit = req.body.submit;
    var result = submit.trim().split(' ');
    console.log('Admin=' + result[1]);
    console.log(result[0]);
    if (result[0] === 'Admin') {
      console.log('Admin');
      console.log('Admin' + result[0]);

      User.findOne({ _id: result[1] }, function (err, foundUser) {
        if (err) {
          console.log(err);
        }
        if (foundUser) {
          User.updateOne({ _id: result[1] }, { isAdmin: true }, function (err) {
            if (err) {
              console.log(err);
            } else {
              User.find({ users: { $ne: null } }, function (err, foundRecords) {
                var mailOptions = {
                  from: process.env.auth_user,
                  to: foundUser.username,
                  subject: 'Gyalpozhing Turf Reservation - Admin Access',
                  html:
                    '<h3>Hello ' +
                    foundUser.username +
                    ', <h4>You are now new admin of the Turf and you have full access right over the reservations of the turf.</a>',
                };
                //sending mail
                transporter.sendMail(mailOptions, function (error, info) {
                  if (error) {
                    console.log('email' + error);
                  } else {
                    res.redirect('/dashboard');
                  }
                });
              });
            }
          });
        }
      });
    }
  } else {
    res.redirect('/admin');
  }
});

//..........................Register User............................//\
app.get('/register', isLoggedin, function (req, res) {
  res.render('admin/register', { currentUser: req.user });
});

app.post('/register', registerValidation, function (req, res) {
  if (req.isAuthenticated()) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        var errMsg = errors.mapped();
        var inputData = matchedData(req);
        res.render('admin/register', {
          errors: errMsg,
          inputData: inputData,
          error: error,
          currentUser: req.user,
        });
      } else {
        User.register(
          {
            name: req.body.name,
            username: req.body.username,
            phone: req.body.phone,
            emailToken: crypto.randomBytes(64).toString('hex'),
            isVerified: false,
          },
          req.body.password,
          function (err, user) {
            if (err) {
              error.push(err);
              res.render('admin/register', {
                currentUser: req.user,
                error: error,
              });
            } else {
              link =
                'http://' +
                req.headers.host +
                '/verify-email?token=' +
                user.emailToken;
              var mailOptions = {
                from: 'Gyalpozhing Turf Reservation',
                to: user.username,
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
                  res.render('admin/register', {
                    successMessage:
                      'Verification link is sent to the gmail account',
                    currentUser: req.user,
                  });
                }
              });
              // res.redirect('/');
            }
          }
        );
      }
    } catch (err) {
      console.log('Verification Invalid!!' + err);
      res.render('register', { erroMessage: 'Something wrong' });
    }
  } else {
    res.redirect('/admin');
  }
});

//........................admin on his Own details........................................
app.get('/myUpdate/:id', function (req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.params.id, function (err, result) {
      res.render('admin/myUpdate', { user: result, currentUser: req.user });
    });
  } else {
    res.redirect('/admin');
  }
});

//.....................UPDATE..........................................
app.post('/myUpdate/:id', async function (req, res) {
  if (req.isAuthenticated()) {
    await User.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/dashboard');
  }
});
//......................................................Booking by user..........................................................//
app.post('/bookTurf', bookValidation, function (req, res) {
  if (req.isAuthenticated()) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var errMsg = errors.mapped();
      var inputData = matchedData(req);
      res.render('user/bookingForm', {
        errors: errMsg,
        inputData: inputData,
        currentUser: req.user,
      });
    } else {
      const newBooking = new Booking({
        id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        phone: req.user.phone,
        date: req.body.date,
        time: req.body.time,
        day: req.body.day,
        jrnlNo: req.body.jrnlNo,
        isConfirm: 'Pending',
      });
      newBooking.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          const id = req.user.id;
          // User.find({ id: req.params.id }, function (err, user) {
          //   console.log(user);

          Booking.find({ id: id }, function (err, foundRecords) {
            var mailOptions = {
              from: req.user.username,
              to: process.env.auth_user,
              subject: 'Gyalpozhing Turf Booking - Booking Request',
              html:
                '<h3> From: ' +
                req.user.username +
                '</h3>Hello Admin, I want to reserve the Turf. Please review my form.<br>Thank you.',
            };

            //Sending mail
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                res.redirect('/bookingForm');
              } else {
                res.redirect('/');
              }
              // });
            });
          });
        }
      });
    }
  } else {
    res.redirect('/userLogin');
  }
});

//..................................User get his Bookings....................................//
app.get('/myBooking', function (req, res) {
  if (req.isAuthenticated()) {
    const id = req.user.id;
    Booking.find({ id: id })
      .sort({ createdAt: -1 })
      .exec(function (err, book) {
        res.render('user/myBookings', {
          myBooking: book,
          currentUser: req.user,
        });
      });
  } else {
    res.redirect('/userLogin');
  }
});

app.get('/myBookings/:id', function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/myBooking');
  } else {
    res.redirect('/userLogin');
  }
});

//............................User Cancel Booking ........................................//

app.post('/cancelBooking', function (req, res) {
  if (req.isAuthenticated()) {
    var submit = req.body.submit;
    var result = submit.trim().split(' ');
    if (result[0] === 'Cancel') {
      Booking.findOne({ _id: result[1] }, function (err, foundUser) {
        if (err) {
          console.log(err);
        }
        if (foundUser) {
          Booking.updateOne(
            { _id: result[1] },
            { isConfirm: 'Cancelled' },
            function (err) {
              if (err) {
                console.log(err);
              } else {
                Booking.find(
                  { bookings: { $ne: null } },
                  function (err, foundRecords) {
                    var mailOptions = {
                      from: foundUser.username,
                      to: process.env.auth_user,
                      subject: 'Gyalpozhing Turf Reservation - Cancellation',
                      html:
                        '<h3>From ' +
                        foundUser.username +
                        ', <h4> I have cancelled the reservation for the turf made from ' +
                        foundUser.time +
                        '(' +
                        foundUser.day +
                        ') ' +
                        'on ' +
                        foundUser.date +
                        '. <br> Thank you.</h4>',
                    };
                    //sending mail
                    transporter.sendMail(mailOptions, function (error, info) {
                      if (error) {
                        console.log('email' + error);
                      } else {
                        res.redirect('/myBooking');
                      }
                    });
                  }
                );
              }
            }
          );
        }
      });
    }
  } else {
    res.redirect('/userLogin');
  }
});

//................Admin on Bookings...........
app.get('/bookingList', function (req, res) {
  if (req.isAuthenticated()) {
    Booking.find()
      .sort({ createdAt: -1 })
      .exec(function (err, book) {
        res.render('admin/bookingList', {
          BookingList: book,
          currentUser: req.user,
        });
      });
  } else {
    res.redirect('/admin');
  }
});

app.get('/deletebooking/:id', async function (req, res) {
  if (req.isAuthenticated()) {
    await Booking.findByIdAndDelete(req.params.id);
    res.redirect('/bookingList');
  } else {
    res.redirect('/admin');
  }
});

//.............Action on Booking......................................
app.post('/actionConfirm', function (req, res) {
  if (req.isAuthenticated()) {
    var submit = req.body.submit;
    var result = submit.trim().split(' ');
    if (result[0] === 'Confirm') {
      Booking.findOne({ _id: result[1] }, function (err, foundUser) {
        if (err) {
          console.log(err);
        }
        if (foundUser) {
          Booking.updateOne(
            { _id: result[1] },
            { isConfirm: 'Confirmed' },
            function (err) {
              if (err) {
                console.log(err);
              } else {
                Booking.find(
                  { bookings: { $ne: null } },
                  function (err, foundRecords) {
                    var mailOptions = {
                      from: process.env.auth_user,
                      to: foundUser.username,
                      subject: 'Gyalpozhing Turf Reservation - confirmation',
                      html:
                        '<h3>Hello ' +
                        foundUser.username +
                        ', <h4> Your reservation for the turf from ' +
                        foundUser.time +
                        '(' +
                        foundUser.day +
                        ') ' +
                        'on ' +
                        foundUser.date +
                        ', has been accepted. <br> We appreciate you being here.</h4>',
                    };
                    //sending mail
                    transporter.sendMail(mailOptions, function (error, info) {
                      if (error) {
                        console.log('email' + error);
                      } else {
                        res.render('admin/bookingList', {
                          BookingList: foundRecords,
                          currentUser: req.user,
                        });
                      }
                    });
                  }
                );
              }
            }
          );
        }
      });
    } else {
      console.log('REJECT' + result[0]);

      Booking.findOne({ _id: result[1] }, function (err, foundUser) {
        if (err) {
          console.log(err);
        }
        if (foundUser) {
          Booking.updateOne(
            { _id: result[1] },
            { isConfirm: 'Cancelled' },
            function (err) {
              if (err) {
                console.log(err);
              } else {
                Booking.find(
                  { bookings: { $ne: null } },
                  function (err, foundRecords) {
                    var mailOptions = {
                      from: process.env.auth_user,
                      to: foundUser.username,
                      subject: 'Gyalpozhing Turf Reservation - confirmation',
                      html:
                        '<h3>Hello ' +
                        foundUser.username +
                        ', <h4> Your reservation for the turf from ' +
                        foundUser.time +
                        '(' +
                        foundUser.day +
                        ') ' +
                        'on ' +
                        foundUser.date +
                        ', is Rejected.<br> Please make 50% Payment and submit the valid Journal Number or You may have reserved the one that was designated. <br> Examine your reservation, please. <br> Thank you.</a>',
                    };
                    //sending mail
                    transporter.sendMail(mailOptions, function (error, info) {
                      if (error) {
                        console.log('email' + error);
                      } else {
                        res.render('admin/bookingList', {
                          BookingList: foundRecords,
                          currentUser: req.user,
                        });
                      }
                    });
                  }
                );
              }
            }
          );
        }
      });
    }
  } else {
    res.redirect('/admin');
  }
});

//.....................................Admin Feedbacks...........................................................//

app.get('/feedback', function (req, res) {
  if (req.isAuthenticated()) {
    Feedback.find({}, function (err, Feedbacks) {
      if (err) {
        console.log(err);
      } else {
        res.render('admin/feedBacks', {
          Feedbacks: Feedbacks,
          currentUser: req.user,
        });
      }
    });
  } else {
    res.redirect('/admin');
  }
});

app.get('/deleteFeed/:id', async function (req, res) {
  if (req.isAuthenticated()) {
    await Feedback.findByIdAndDelete(req.params.id);
    res.redirect('/feedback');
  } else {
    res.redirect('/admin');
  }
});

//..................................................Chnage Pass,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,//

app.get('/cpass', isLoggedin, function (req, res) {
  res.render('user/changePass', { currentUser: req.user });
});

app.post('/changepassword', isLoggedin, changeValidation, function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var errMsg = errors.mapped();
      var inputData = matchedData(req);
      res.render('user/changePass', {
        errors: errMsg,
        inputData: inputData,
        error: error,
        currentUser: req.user,
      });
    } else {
      User.findByUsername(req.body.username, (err, user) => {
        if (err) {
          res.send(err);
          console.log(err);
        } else {
          user.changePassword(
            req.body.oldpassword,
            req.body.newpassword,
            function (err) {
              if (err) {
                res.send(err);
              } else {
                res.redirect('/');
              }
            }
          );
        }
      });
    }
  } catch (err) {
    console.log('Verification Invalid!!' + err);
    res.render('user/changePass', { erroMessage: 'Something wrong' });
  }
});

app.get('/admincpass', aisLoggedin, function (req, res) {
  res.render('admin/changePass', { currentUser: req.user });
});

app.post(
  '/achangepassword',
  aisLoggedin,
  changeValidation,
  function (req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        var errMsg = errors.mapped();
        var inputData = matchedData(req);
        res.render('admin/changePass', {
          errors: errMsg,
          inputData: inputData,
          error: error,
          currentUser: req.user,
        });
      } else {
        User.findByUsername(req.body.username, (err, user) => {
          if (err) {
            res.send(err);
            console.log(err);
          } else {
            user.changePassword(
              req.body.oldpassword,
              req.body.newpassword,
              function (err) {
                if (err) {
                  res.send(err);
                } else {
                  res.redirect('/dashboard');
                }
              }
            );
          }
        });
      }
    } catch (err) {
      console.log('Verification Invalid!!' + err);
      res.render('register', { erroMessage: 'Something wrong' });
    }
  }
);
//.................................................Admin Logout ....................................................//
app.get('/admin-Logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/admin');
  });
});
//..................................................userLogout..........................................................//
app.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

//.......................................................Forgot Password......................................................//
var token1;
app.get('/verify-password', function (req, res) {
  const token = req.query.token;
  token1 = token;
  const user = User.findOne({
    emailToken: token,
  });
  if (user) {
    res.render('user/resetPassword');
  }
});

app.post('/resetPassword', forgotValidation, function (req, res) {
  try {
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      var errMsg = errors.mapped();
      var inputData = matchedData(req);
      res.render('user/resetPassword', {
        errors: errMsg,
        inputData: inputData,
      });
    } else {
      console.log('TOKKEEEEN ' + token1);
      const user = User.findOne({
        emailToken: token1,
      });
      console.log('USERNAME ' + user);
      if (user) {
        console.log(user.name);
        user.setPasssword(req.body.password, function (err) {
          if (err) {
            res.render('user/resetPassword', {
              errorMessage: err,
            });
          } else {
            res.render('user/userLogin', {
              successMessage:
                'You have successfully reset your new password, Please login to continue...',
            });
          }
        });
      }
    }
  } catch (err) {
    console.log('Verification Failed here ' + err);
    res.render('user/userLogin', {
      errorMessage: err,
    });
  }
});

app.get('/forgotPassword1', function (req, res) {
  res.render('user/forgotPass');
});

app.post('/forgotPassword1', forgotValidation, function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var errMsg = errors.mapped();
    var inputData = matchedData(req);
    res.render('user/forgotPass', {
      errors: errMsg,
      inputData: inputData,
    });
  } else {
    User.findOne(
      {
        username: req.body.username,
      },
      function (err, foundUser) {
        if (err) {
          console.log(err);
          res.render('user/forgotPass', {
            errorMessage: err,
          });
        } else if (foundUser) {
          link =
            'http://' +
            req.headers.host +
            '/verify-password?token=' +
            foundUser.emailToken;
          var mailOptions = {
            from: 'Gyelpozhing Turf Booking',
            to: req.body.username,
            subject: 'Gyelpozhing Turf Booking - Reset Password',
            html:
              '<h2>Hello ' +
              foundUser.name +
              ',</h2><br><h4>Please click the link given below to reset forgot password.</h4><br><a href=' +
              link +
              '>Click here</a>',
          };

          //sending mail
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              res.render('user/forgotPass', {
                errorMessage: error + ' No such User found!',
              });
            } else {
              console.log('Verification link is sent to your gmail account');
              res.render('user/forgotPass', {
                successMessage:
                  'Reset Verification link has been successfully to your register email.',
              });
            }
          });
        } else {
          res.render('user/forgotPass', {
            errorMessage: 'No such User found!',
          });
        }
      }
    );
  }
});

//....................................................//////
app.get('/forgotPassword', function (req, res) {
  res.render('user/forgotPass', { currentUser: req.user });
});

app.post('/forgotPassword', forgotValidation, function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var errMsg = errors.mapped();
    var inputData = matchedData(req);
    res.render('user/forgotPass', {
      errors: errMsg,
      inputData: inputData,
    });
  } else {
    User.findOne({ username: req.body.username }).then((u) => {
      u.setPassword(req.body.password, (err, u) => {
        if (err) {
          console.log(err);
        } else {
          u.save();
          res.redirect('/userLogin');
        }
      });
    });
  }
});

app.get('/aforgotPass', function (req, res) {
  res.render('admin/forgotPass');
});

app.post('/aforgotPass', forgotValidation, function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var errMsg = errors.mapped();
    var inputData = matchedData(req);
    res.render('admin/forgotPass', {
      errors: errMsg,
      inputData: inputData,
    });
  } else {
    User.findOne({ username: req.body.username }).then((u) => {
      u.setPassword(req.body.password, (err, u) => {
        if (err) {
          console.log(err);
        } else {
          u.save();
          res.redirect('/admin');
        }
      });
    });
  }
});

app.post('/search', async (req, res) => {
  const sear = req.body.getdate;
  const data = await Booking.find({
    $or: [{ getdate: { $regex: sear } }],
  });
  res.render('user/searchFind', {
    data: data,
    currentUser: req.user,
    sear: sear,
  });
});

let port = process.env.PORT;
if (port == null || port == '') {
  port = 3000;
}
app.listen(port, function () {
  console.log(`App running on port ${port} ..`);
});
