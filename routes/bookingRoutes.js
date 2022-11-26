const express = require('express');
const router = express.Router();
const app = express();
const User = require('../models/userModels');
const { validationResult, matchedData } = require('express-validator');
const { bookValidation } = require('../validator/bookingValidation');
const Booking = require('../models/bookingModels');
const crypto = require('crypto');
const { transporter } = require('../config/email');
const { loginrequired } = require('../config/JWT');
var fs = require('fs');
var path = require('path');
const multer = require('multer');

router.get('/bookingForm', loginrequired, function (req, res) {
  res.render('bookingForm');
});

router.get('/bookingform/:id', function (req, res) {
  User.findById(req.params.id, function (err, result) {
    res.render('bookingForm', { user: result });
  });
});

// router.get('/bookingForm', function (req, res) {
//   User.findById(req.params.id, function (err, result) {
//     res.render(result);
//   });
// });

// router.get('/bookingForm/:id', function (req, res) {
//   User.findById(req.params.id, function isEmpty(err, result) {
//     if (result) {
//       res.render('bookingForm', { user: result });
//     }
//   });
// });

// router.post('/bookingForm', bookingValidation, function (req, res) {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       var errMsg = errors.mapped();
//       var inputData = matchedData(req);
//       res.render('bookingForm', { errors: errMsg, inputData: inputData });
//     } else {
//       const newBooking = new Booking({
//         date: req.body.date,
//         time: req.body.time,
//         day: req.body.day,
//         isConfirm: false,
//       });
//       newBooking.save(function (err) {
//         if (err) {
//           console.log(err);
//         } else {
//           console.log('success');
//         }
//         // else {
//         //   var mailOptions = {
//         //     from: req.body.email,
//         //     to: process.env.auth_user,
//         //     subject: 'Gyelpozhing Turf Booking - Booking Requested',
//         //     html:
//         //       '<h3> From: ' +
//         //       req.body.email +
//         //       '</h3>Hello Admin, i am ' +
//         //       req.body.name +
//         //       ', i want to booked your ground la. Can you please go through my request form la.<br>Thank you la.',
//         //   };

//         //   var sendingMail = transporter.sendMail(
//         //     mailOptions,
//         //     function (err, info) {
//         //       if (error) {
//         //         res.render('bookingForm', { successMessage: error });
//         //       } else {
//         //         res.render('bookingForm', {
//         //           successMessage: 'Form submitted successfully',
//         //         });
//         //       }
//         //     }
//         //   );
//         // }
//       });
//     }
//   } catch (err) {
//     res.render('bookingForm', { errorMessage: err });
//   }
// });

router.post('/bookingForm', bookValidation, function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var errMsg = errors.mapped();
    var inputData = matchedData(req);
    res.render('bookingForm', { errors: errMsg, inputData: inputData });
  } else {
    const newBooking = new Booking({
      id: req.body.id,
      email: req.body.email,
      date: req.body.date,
      time: req.body.time,
      day: req.body.day,
      jrnlNo: req.body.jrnlNo,
      isConfirm: false,
    });
    newBooking.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        const id = req.body.id;
        // User.find({ id: req.params.id }, function (err, user) {
        //   console.log(user);

        Booking.find({ id: id }, function (err, foundRecords) {
          var mailOptions = {
            from: req.body.email,
            to: process.env.auth_user,
            subject: 'Gyalpozhing Turf Booking - Booking Request',
            html:
              '<h3> From: ' +
              req.body.email +
              '</h3>Hello Admin, I want to reserve the Turf. Please review my form.<br>Thank you.',
          };

          //Sending mail
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              res.render('bookingForm', { successMessage: error });
            } else {
              res.render('myBooking', { myBooking: foundRecords });
            }
            // });
          });
        });
      }
    });
  }
});

//Admin on Bookings

router.get('/bookingList', function (req, res) {
  Booking.find({}, function (err, book) {
    res.render('bookingList', {
      BookingList: book,
    });
  });
});

router.get('/deletebooking/:id', async function (req, res) {
  await Booking.findByIdAndDelete(req.params.id);
  res.redirect('/bookingList');
});

// router.get('/myBooking', function (req, res) {
//   User.find({}, function (err, user) {
//     console.log(user.id);
//   });
// });

// router.get('/myBooking/:id', function (req, res) {
//   User.findById(req.params.id, function (err, user) {
//     Booking.find({}, function (err, book) {
//       const mail = user.id;
//       const myEmail = [];
//       book.forEach((booking) => {
//         myEmail.push(booking.id);
//       });
//       myEmail.forEach((result) => {
//         if (result === mail) {
//           Booking.find({ id: mail }, function (req, Book) {
//             console.log(Book);
//           });
//         }
//       });
//     });
//   });
// });

router.get('/myBooking/:id', function (req, res) {
  User.findById(req.params.id, function (err, user) {
    const id = user.id;
    Booking.find({ id: id }, function (req, Book) {
      res.render('myBooking', { myBooking: Book });
    });
  });
});

router.post('/actionConfirm', function (req, res) {
  var submit = req.body.submit;
  var result = submit.trim().split(' ');
  console.log('Confirm=' + result[1]);
  if (result[0] === 'Confirm') {
    console.log('CONFIRM');
    console.log('CONFIRM' + result[0]);

    Booking.findOne({ _id: result[1] }, function (err, foundUser) {
      if (err) {
        console.log(err);
      }
      if (foundUser) {
        Booking.updateOne(
          { _id: result[1] },
          { isConfirm: true },
          function (err) {
            if (err) {
              console.log(err);
            } else {
              Booking.find(
                { bookings: { $ne: null } },
                function (err, foundRecords) {
                  var mailOptions = {
                    from: process.env.auth_user,
                    to: foundUser.email,
                    subject: 'Gyalpozhing Turf Reservation - confirmation',
                    html:
                      '<h2>Hello ' +
                      foundUser.email +
                      ', Your reservation is Confirmed. Thanks for using our System.</a>',
                  };
                  //sending mail
                  transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                      console.log('email' + error);
                    } else {
                      res.render('bookingList', { BookingList: foundRecords });
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
    console.log('REJECT');
    console.log('REJECT' + result[0]);

    Booking.findOne({ _id: result[1] }, function (err, foundUser) {
      if (err) {
        console.log(err);
      }
      if (foundUser) {
        Booking.deleteOne({ _id: result[1] }, function (err) {
          if (err) {
            console.log(err);
          } else {
            Booking.find(
              { bookings: { $ne: null } },
              function (err, foundRecords) {
                var mailOptions = {
                  from: process.env.auth_user,
                  to: foundUser.email,
                  subject: 'Gyalpozhing Turf Reservation - confirmation',
                  html:
                    '<h2>Hello ' +
                    foundUser.email +
                    ', <h4>Your reservation is Rejected. Please make 50% Payment and submit the valid Journal Number or You may have reserved the one that was designated. Examine your reservation, please. <br> Thank you.</a>',
                };
                //sending mail
                transporter.sendMail(mailOptions, function (error, info) {
                  if (error) {
                    console.log('email' + error);
                  } else {
                    res.render('bookingList', { BookingList: foundRecords });
                  }
                });
              }
            );
          }
        });
      }
    });
  }
});

module.exports = router;
