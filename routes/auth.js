const express = require('express');
const {check} = require("express-validator/check"); // importing for valiation purposes
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', check("email").isEmail(), authController.postLogin);

router.post('/signup', check("email").isEmail(), authController.postSignup);

router.post('/logout', authController.postLogout);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post('/new-password', authController.postUpdatedPassword);


module.exports = router;