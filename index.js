const router = module.exports = require('express').Router();

router.use('/vehicles', require('./vehicles'));
router.use('/loads', require('./loads'));
//router.use('/login', require('./login'));