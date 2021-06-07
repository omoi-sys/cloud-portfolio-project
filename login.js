const express = require('express');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
require('dotenv').config();
const request = require('request');

const ds = require('./datastore');
const datastore = ds.datastore;

const router = express.Router();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SCOPE = process.env.SCOPE;
const REDIRECT_URI = process.env.REDIRECT_URI;
const DOMAIN = process.env.DOMAIN;

const client = new OAuth2Client(CLIENT_ID);

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const url = oauth2Client.generateAuthUrl({
  access_type: 'online',
  scope: SCOPE
});

// Look for user
check_user = (auth_id) => {
  const query = datastore.createQuery('User').filter('auth_id', '=', auth_id);
  return datastore.runQuery(query).then((user) => {
    if (typeof user[0][0] !== 'undefined') {
      return ds.fromDatastore(user[0][0]);
    }
    return user[0][0];
  });
}

// Save user to database
post_user = (auth_id) => {
  let key = datastore.key('User');
  const new_user = {
    'auth_id': auth_id
  }
  return datastore.save({ 'key': key, 'data': new_user }).then(() => {
    return key.id;
  });
}

// Welcome Page route, will render home page with a button that leads to authentication
router.get('/', (req, res) => {
  const STATE = crypto.randomBytes(30).toString('hex');
  let auth_uri = url;
  res.append('Set-Cookie', 'state=' + STATE);
  res.render('main', {layout: 'index', auth_uri: auth_uri});
});

// Redirect route, will handle all the authorization and getting data needed
router.get('/userinfo', (req, res) => {
  console.log(req.query.code);
  const { tokens } = oauth2Client.getToken(req.query.code).then( (tokens) => {
    console.log(tokens['tokens']['id_token']);
    oauth2Client.setCredentials(tokens);

    const ticket = client.verifyIdToken({
      idToken: tokens['tokens']['id_token'],
      audience: CLIENT_ID
    }).then( (ticket) => {
      const payload = ticket.getPayload();
      const userid = payload['sub'];
      
      check_user(userid).then((user) => {
        if (typeof user === 'undefined') {
          post_user(userid).then( (user_id) => {
            res.render('main', { layout: 'greeting', jwt: tokens['tokens']['id_token'], userid: user_id});
          });
        } else {
          res.render('main', { layout: 'greeting', jwt: tokens['tokens']['id_token'], userid: user.id});
        }
      });
    });
  });
});



// export module
module.exports = router;