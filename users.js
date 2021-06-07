const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const bodyParser = require('body-parser');
require('dotenv').config();
const router = express.Router();

router.use(bodyParser.json());

const ds = require('./datastore');
const datastore = ds.datastore;

const link = 'https://serratab-portfolio.wl.r.appspot.com'
//const link = 'http://localhost:8080'

const CLIENT_ID = process.env.CLIENT_ID;
const USER = 'User';

const client = new OAuth2Client(CLIENT_ID);

// All users, no authorization
unsecured_users = () => {
  const query = datastore.createQuery(USER);
  return datastore.runQuery(query).then((entities) => {
    return entities[0].map(ds.fromDatastore);
  })
}

// Authorized user
secured_user = (user_id) => {
  const key = datastore.key([USER, parseInt(user_id)]);
  return datastore.get(key).then((user) => {
    if (typeof user[0] !== 'undefined') {
      return ds.fromDatastore(user[0]);
    }
    return user[0];
  });
}

// Get specific user with correct authorization
router.get('/:user_id', (req, res) => {
  const accepts = req.accepts(['application/json', 'text/html']);
  if (!accepts) {
    res.status(406).send('Not Acceptable');
  }

  const tokenH = req.header('authorization').split(' ');
  const token = tokenH[1];
  client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID
  }).then((ticket) => {
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    if (typeof userid === 'undefined') {
      res.status(401).json({
        'Error': 'No valid authorization token provided.'
      });
    }

    secured_user(req.params.user_id).then((user) => {
      if (typeof user === 'undefined') {
        res.status(404).send({
          'Error': 'No user with this user_id exists'
        });
      } else {
        if (user.auth_id === userid) {
          user.self = link + '/users/' + user.id;
          res.status(200).send(user);
        } else {
          res.status(403).send({
            'Error': 'Authorization token does not match user info.'
          });
        }
      }
    }).catch((error) => {
      res.status(401).send('No valid authorization token provided.');
    });
  });
});

// Get all users, regardless of authorization
router.get('/', (req, res) => {
  const accepts = req.accepts(['application/json', 'text/html']);
  if (!accepts) {
    res.status(406).send('Not Acceptable');
  }

  const users = unsecured_users().then((users) => {
    for(let i = 0; i < users.length; i++) {
      users[i].self = link + '/users/' + users[i].id;
    }
    res.status(200).send(users)
  });
});

// export module
module.exports = router;