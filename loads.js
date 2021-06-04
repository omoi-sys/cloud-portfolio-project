const express = require('express');
const router = express.Router();

const ds = require('./datastore');
const datastore = ds.datastore;

const LOAD = 'Load';

// export module
module.exports = router;