const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const User = require('../models/user');
const nodemailer = require("nodemailer");
const sendgridTransport = require('nodemailer-sendgrid-transport');
const {validationResult} = require("express-validator/check");

const transport = nodemailer.createTransport(sendgridTransport({
  auth:{
    api_key: "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"
  }
}))

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    values: {
      email: "",
      password: ""
    }
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    values: {
      email: "",
      password: "",
      confirmPassword: ""
    }
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const error = validationResult(req);

  if(!error.isEmpty()){
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: "Invalid email adress",
      values: {
        email: email,
        password: password
      }
    });
  }
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/login');
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
          req.flash('error', 'Invalid email or password.');
          res.redirect('/login');
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  const error = validationResult(req);

  if(!error.isEmpty()){
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: "Invalid email adress",
      values: {
        email: email,
        password: password,
        confirmPassword: confirmPassword
      }
    });
  }

  if(password.length < 5){
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: "Password must be at least 5 characters long! :("
    });
  }

  if(password !== confirmPassword){
    return res.status(403).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: "Passwords must match! :("
    });
  }

  User.findOne({ email: email })
    .then(userDoc => {
      if (userDoc) {
        req.flash('error', 'E-Mail exists already, please pick a different one.');
        return res.redirect('/signup');
      }
      return bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] }
          });
          return user.save();
        })
        .then(result => {
          res.redirect('/login');
          return transport.sendMail({
            to: email,
            from: "ecomforce4business@gmail.com",
            subject: "Registration successful!",
            html: "<h1> Welcome to Dominykas online store!</h1><br><h2>Now you can add your own products or even sell or buy anything!</h2>"
          })
          .then(res => console.log("your email was send successfuly to ", email))

        });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req,res,next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset password',
    errorMessage: message
  });
}

exports.postReset = (req,res,next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if(err){
      console.log("error caused by postReset controller");
      res.redirect("/reset");
    }
    const token = buffer.toString("hex");

    User.findOne({email: req.body.email})
    .then(user => {
      if(!user){
        req.flesh("error", "No existing account with this email");
        res.redirect("/signup");
      }
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;

      return user.save();
    })
    .then(result => {
      res.redirect("/");
      transport.sendMail({
        to: req.body.email,
        from: "ecomforce4business@gmail.com",
        subject: "Reset your password!",
        html: `
          <p> You requested a password reset </p>
          <p> Click this <a href="http://localhost:3000/reset/${token}">Link</a> to set a new password for your account</p>
          <br>
          <footer>Have a nice day! </footer>
        `
      })
      .then(res => console.log("your email for resseting password was send successfuly to ", email))

    })
    .catch(err => console.log("error in postReset controller"));
  })
}

exports.getNewPassword = (req,res,next) => {

  const token = req.params.token;

  User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
  .then(user => {
    let message = req.flash('error');
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }
    
    res.render('auth/newPasswordForm', {
      path: '/new-password',
      pageTitle: 'New password',
      errorMessage: message,
      userId: user._id.toString(),
      passwordToken: token

    });
  })
  .catch(err => console.log("error occured in posting new password controller! ", err)); 
}

exports.postUpdatedPassword = (req,res,next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      resetUser = user;
      console.log("req data: ", req.body)
      console.log("gautas useris: ",user );

      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      console.log("error in postUpdatedPassword controller, ", err);
    });

}