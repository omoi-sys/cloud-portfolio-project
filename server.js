const express = require('express');
const handlebars = require('express-handlebars').create({defaultLayout: 'main'});
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
require('dotenv').config();
const request = require('request');
const app = express();

const ds = require('./datastore');
const datastore = ds.datastore;

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));

app.use('/', require('./index'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});