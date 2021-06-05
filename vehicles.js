const express = require('express');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();
const router = express.Router();

const ds = require('./datastore');
const datastore = ds.datastore;

const link = 'https://serratab-portfolio.wl.r.appspot.com'

const CLIENT_ID = process.env.CLIENT_ID;
const VEHICLE = 'Vehicle';

const client = new OAuth2Client(CLIENT_ID);

/* =============== Start of Model Functions =============== */

// Add a vehicle
post_vehicle = (make, model, type, capacity, owner) => {
  let key = datastore.key(VEHICLE);
  const new_vehicle = {
    'make': make,
    'model': model,
    'type': type,
    'capacity': capacity,
    'owner': owner,
    'loads': []
  };

  return datastore.save({ 'key': key, 'data': new_vehicle }).then(() => {
    let entity = {
      'id': key.id,
      'make': make,
      'model': model,
      'type': type,
      'capacity': capacity,
      'owner': owner,
      'loads': [],
      'self': link + '/vehicles/' + key.id.toString()
    }
    return entity;
  });
}


// Get a vehicle with its id
get_vehicle = (vehicle_id) => {
  const key = datastore.key([VEHICLE, parseInt(vehicle_id, 10)]);
  return datastore.get(key).then( (data) => {
    return ds.fromDatastore(data[0]);
  });
}

// Get all vehicles
get_vehicles = (req, owner) => {
  let query = datastore.createQuery(VEHICLE).filter('owner' === owner).limit(5);
  let results = {};
  if (Object.keys(req.query).includes('cursor')) {
    query = query.start(req.query.cursor);
  }
  return datastore.runQuery(query).then( (entities) => {
    results.vehicles = entities[0].map(ds.fromDatastore);
    if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
      results.next = 'https://' + req.get('host') + req.baseUrl + '?cursor=' + entities[1].endCursor;
    }
    return results;
  });
}

// Update a vehicle with PATCH
patch_vehicle = (vehicle_id, owner, vehicle, body) => {
  const key = datastore.key([VEHICLE, parseInt(vehicle_id, 10)]);
  let update_vehicle = {};

  if (typeof body.make === 'undefined') {
    update_vehicle.make = vehicle.make;
  } else {
    update_vehicle.make = body.make;
  }

  if (typeof body.model === 'undefined') {
    update_vehicle.model = vehicle.model;
  } else {
    update_vehicle.model = body.model;
  }

  if (typeof body.type === 'undefined') {
    update_vehicle.type = vehicle.type;
  } else {
    update_vehicle.type = body.type;
  }

  if (typeof body.capacity === 'undefined') {
    update_vehicle.capacity = vehicle.capacity;
  } else {
    update_vehicle.capacity = body.capacity
  }

  update_vehicle.owner = owner;
  update_vehicle.loads = vehicle.loads;

  return datastore.save({ 'key': key, 'data': update_vehicle });
}

// Update a vehicle with PUT
put_vehicle = (vehicle_id, make, model, type, capacity, owner, loads) => {
  const key = datastore.key([VEHICLE, parseInt(vehicle_id, 10)]);
  const update_vehicle = {
    'make': make,
    'model': model,
    'type': type,
    'capacity': capacity,
    'owner': owner,
    'loads': loads
  };
  return datastore.save({ 'key': key, 'data': update_vehicle });
}

assign_load = (vehicle, vehicle_id, load, load_id) => {
  const load_key = datastore.key(['Load', parseInt(load_id, 10)]);
  const vehicle_key = datastore.key([VEHICLE, parseInt(vehicle_id, 10)]);

  vehicle.loads.push(load_id);
  load.carrier = vehicle_id;

  return datastore.save({ 'key': load_key, 'data': load }).then(() => {
    return datastore.save({ 'key': vehicle_key, 'data': vehicle }).then(() => {return});
  });
}

// Delete a vehicle while updating loads if necessary
delete_vehicle = (vehicle_id, vehicle) => {
  if (vehicle.loads.length > 0) {
    let loads = vehicle.loads;
    // Update every load in list
    for (let i = 0; i < loads.length; i++) {
      let load_key = datastore.key(['Load', parseInt(loads[i].id, 10)]);
      const load = datastore.get(load_key).then(load => {
        let load_data = {
          'weight': load[0].weight,
          'carrier': null,
          'content': load[0].content,
          'creation_date': load[0].creation_date
        };
        datastore.save({ 'key': load_key, 'data': load_data });
      });
    }
  }
  const key = datastore.key([VEHICLE, parseInt(vehicle_id, 10)]);
  return datastore.delete(key);
}

// Updates the vehicle and load to not be related to each other anymore
remove_load = (vehicle, vehicle_id, load, load_id) => {
  const load_index = vehicle.loads.indexOf(load);
  vehicle.loads.splice(load_index, 1);
  load.carrier = null;

  vehicle_key = datastore.key([VEHICLE, parseInt(vehicle_id, 10)]);
  load_key = datastore.key(['Load', parseInt(load_id, 10)]);
  
  datastore.save({ 'key': vehicle_key, 'data': vehicle }).then( entity => {
    return datastore.save({ 'key': load_key, 'data': load }).then( entity => {
      return;
    });
  });
}

/* =============== End of Model Functions ================= */

/* =============== Start of Controller Functions ============= */

// POST route
router.post('/', (req, res) => {
  if (typeof req.header('authorization') === 'undefined') {
    res.status(401).end();
  }
  const tokenH = req.header('authorization').split(' ');
  const token = tokenH[1];
  const ticket = client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID
  }).then((ticket) => {
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    if (typeof userid === 'undefined') {
      res.status(403).json({
        'Error': 'Authorization token does not match user info.'
      });
    }
    
    if (typeof req.body.make === 'undefined' || typeof req.body.make !== 'string' ||
    typeof req.body.model === 'undefined' || typeof req.body.model !== 'string' || 
    typeof req.body.type === 'undefined' || typeof req.body.type !== 'string' || 
    typeof req.body.capacity === 'undefined' || typeof req.body.capacity !== 'number') {
      res.status(400).send({
        'Error': 'The request object is missing at least one of the required attributes'
      });
    } else {
      if (Object.keys(req.body).length < 4) {
        res.status(400).send({
          'Error': 'The request object is missing at least one of the required attributes'
        });
      } else {
        post_vehicle(req.body.make, req.body.model, req.body.type, req.body.capacity, userid).then( (vehicle) => {
          res.location(link + '/vehicles/' + vehicle.id);
          res.status(201).send(vehicle);
        });
      }
    }
  }).catch((error) => {
    res.status(401).end();
  });
});

router.get('/:vehicle_id', (req, res) => {
  const accepts = req.accepts(['application/json', '*/*']);
  if (!accepts) {
    res.status(406).end();
  }

  if (typeof req.header('authorization') === 'undefined') {
    res.status(401).end();
  }

  const tokenH = req.header('authorization').split(' ');
  const token = tokenH[1];
  const ticket = client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID
  }).then((ticket) => {
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    if (typeof userid === 'undefined') {
      res.status(401).end();
    }
    get_vehicle(req.params.vehicle_id).then( (vehicle) => {
      if (typeof vehicle === null) {
        res.status(404).send({
          'Error': 'No vehicle with this vehicle_id exists'
        });
      } else {
        if (vehicle.owner === userid) {
          res.status(200).json(vehicle);
        } else {
          res.status(403).send({
            'Error': 'Authorization token does not match user info.'
          });
        }
      }
    });
  }).catch((error) => {
    res.status(401).end();
  })
});

// List all vehicles that belong to user
router.get('/', (req, res) => {
  const accepts = req.accepts(['application/json', '*/*']);
  if (!accepts) {
    res.status(406).end();
  }
  
  if (typeof req.header('authorization') === 'undefined') {
    res.status(401).send({
      'Error': 'No valid authorization token provided.'
    });
  } else {
    const tokenH = req.header('authorization').split(' ');
    const token = tokenH[1];
    const ticket = client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID
    }).then((ticket) => {
      const payload = ticket.getPayload();
      const userid = payload['sub'];
      if (typeof userid === 'undefined') {
        res.status(401).send({
          'Error': 'No valid authorization token provided.'
        });
      }
      get_vehicles(req, userid).then((vehicles) => {
        if (vehicles.vehicles.length === 0) {
          res.status(403).send({
            'Error': 'Authorization token does not match user info.'
          });
        }
        res.status(200).send(vehicles);
      });
    }).catch((error) => {
      res.status(401).send({
        'Error': 'No valid authorization token provided.'
      });
    });
  }
});


// List all loads for a vehicle
router.get('/:vehicle_id/loads', (req, res) => {
  const accepts = req.accepts(['application/json', '*/*']);
  if (!accepts) {
    res.status(406).end();
  }

  const tokenH = req.header('authorization').split(' ');
  const token = tokenH[1];
  const ticket = client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID
  }).then((ticket) => {
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    if (typeof userid === 'undefined') {
      res.status(401).end();
    }
    get_vehicle(req.params.vehicle_id).then((vehicle) => {
      if (typeof vehicle === 'undefined') {
        res.status(404).end();
      } else {
        if (vehicle.owner === userid) {
          res.status(200).send(vehicle);
        } else {
          res.status(403).send({
            'Error': 'Authorization token does not match user info.'
          });
        }
      }
    });
  }).catch((error) => {
    res.status(401).end();
  })
});

// Update a vehicle with any number of params
router.patch('/:vehicle_id', (req, res) => {
  if (typeof req.body.id !== 'undefined') {
    if (req.body.id.toString() !== req.params.vehicle_id) {
      res.status(400).send({
        'Error': 'The request object is missing at least one of the required attributes or an attempt to change the id was made'
      });
    }
  }

  if (typeof req.body.make !== 'undefined' && typeof req.body.make !== 'string' ||
  typeof req.body.model !== 'undefined' && typeof req.body.model !== 'string' || 
  typeof req.body.type !== 'undefined' && typeof req.body.type !== 'string' || 
  typeof req.body.capacity !== 'undefined' && typeof req.body.capacity !== 'number') {
    res.status(400).send({
      'Error': 'The request object is missing at least one of the required attributes or an attempt to change the id was made'
    });
  }

  if (typeof req.header('authorization') === 'undefined') {
    res.status(401).send({
      'Error': 'No valid authorization token provided.'
    });
  } else {
    const tokenH = req.header('authorization').split(' ');
    const token = tokenH[1];
    const ticket = client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID
    }).then((ticket) => {
      const payload = ticket.getPayload();
      const userid = payload['sub'];

      if (typeof userid === 'undefined') {
        res.status(401).send({
          'Error': 'No valid authorization token provided.'
        });
      }

      get_vehicle(req.params.vehicle_id).then((vehicle) => {
        if (typeof vehicle === 'undefined') {
          res.status(404).send({
            'Error': 'No vehicle with this vehicle_id exists'
          });
        } else {
          if (vehicle.owner === userid) {
            patch_vehicle(req.params.vehicle_id, vehicle.owner, vehicle, req.body).then(() => {
              res.location(link + '/vehicles/' + req.params.vehicle_id);
              res.status(201).end();
            });
          } else {
            res.status(403).send({
              'Error': 'Authorization token does not match user info.'
            });
          }
        }
      });
    }).catch((error) => {
      res.status(401).end();
    })
  }
});

// Update a vehicle requiring all params
router.put('/:vehicle_id', (req, res) => {
  if (typeof req.header('authorization') === 'undefined') {
    res.status(401).end();
  }

  if (typeof req.body.id !== 'undefined') {
    if (req.body.id.toString() !== req.params.vehicle_id) {
      res.status(400).send({
        'Error': 'The request object is missing at least one of the required attributes or an attempt to change the id was made'
      });
    }
  }

  const tokenH = req.header('authorization').split(' ');
  const token = tokenH[1];
  const ticket = client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID
  }).then((ticket) => {
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    if (typeof userid === 'undefined') {
      res.status(403).json({
        'Error': 'Authorization token does not match user info.'
      });
    }
    
    if (typeof req.body.make === 'undefined' || typeof req.body.make !== 'string' ||
    typeof req.body.model === 'undefined' || typeof req.body.model !== 'string' || 
    typeof req.body.type === 'undefined' || typeof req.body.type !== 'string' || 
    typeof req.body.capacity === 'undefined' || typeof req.body.capacity !== 'number') {
      res.status(400).send({
        'Error': 'The request object is missing at least one of the required attributes or an attempt to change the id was made'
      });
    } else {
      if (Object.keys(req.body).length < 4) {
        res.status(400).send({
          'Error': 'The request object is missing at least one of the required attributes or an attempt to change the id was made'
        });
      } else {
        get_vehicle(req.params.vehicle_id).then((vehicle) => {
          if (typeof vehicle === 'undefined') {
            res.status(404).send({
              'Error': 'No vehicle with this vehicle_id exists'
            });
          }

          if (vehicle.owner === userid) {
            put_vehicle(req.params.vehicle_id, req.body.make, req.body.model, req.body.type, req.body.capacity, userid, vehicle.loads).then( (vehicle) => {
              res.location(link + '/vehicles/' + vehicle.id);
              res.status(303).send(vehicle);
            });
          } else {
            res.status(403).send({
              'Error': 'Authorization token does not match user info.'
            });
          }
        });
      }
    }
  }).catch((error) => {
    res.status(401).end();
  });
});

// Delete a vehicle, any loads loaded will be unloaded first
router.delete('/:vehicle_id', (req, res) => {
  if (typeof req.header('authorization') === 'undefined') {
    res.status(401).end();
  }

  const tokenH = req.header('authorization').split(' ');
  const token = tokenH[1];
  const ticket = client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID
  }).then( (ticket) => {
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    
    if (typeof userid === 'undefined') {
      res.status(403).send({
        'Error': 'Authorization token does not match user info.'
      });
    } else {
      get_vehicle(req.params.vehicle_id).then((vehicle) => {
        if (typeof vehicle === 'undefined') {
          res.status(404).send({
            'Error': 'No vehicle with this vehicle_id exists'
          });
        }
  
        if (vehicle.owner === userid) {
          delete_vehicle(req.params.vehicle_id).then(() => {
            res.status(204).end();
          });
        } else {
          res.status(403).send({
            'Error': 'Authorization token does not match user info.'
          });
        }
      });
    }
  }).catch((error) => {
    res.status(401).end();
  })
});

// Method Not Allowed
router.delete('/', (req, res) => {
  res.set('Accept', 'GET, POST');
  res.status(405).end();
});

// Method Not Allowed
router.put('/', (req, res) => {
  res.set('Accept', 'GET, POST');
  res.status(405).end();
});

// Assign a load to a vehicle
router.put('/:vehicle_id/loads/:load_id', (req, res) => {
  if (typeof req.header('authorization') === 'undefined') {
    res.status(401).end();
  }

  const tokenH = req.header('authorization').split(' ');
  const token = tokenH[1];
  const ticket = client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID
  }).then((ticket) => {
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    if (typeof userid === 'undefined') {
      res.status(403).json({
        'Error': 'Authorization token does not match user info.'
      });
    }

    get_vehicle(req.params.vehicle_id).then((vehicle) => {
      if (typeof vehicle === 'undefined') {
        res.status(404).send({
          'Error': 'The specified vehicle and/or load does not exist'
        });
      }

      if (vehicle.owner === userid) {
        const load_key = datastore.key(['Load', parseInt(req.params.load_id, 10)]);
        const load = datastore.get(load_key).then( load => {
          if (typeof load[0] === 'undefined') {
            res.status(404).send({
              'Error': 'The specified vehicle and/or load does not exist'
            });
          }

          if (load[0].carrier === null) {
            assign_load(vehicle, req.params.vehicle_id, load[0], req.params.load_id).then(() => {
              res.status(204).end();
            });
          } else {
            res.status(403).send({
              'Error': 'The load must be removed from vehicle first'
            });
          }
        });
      }
    });
  }).catch((error) => {
    res.status(401).end();
  });
});

// Unassign a load from a vehicle
router.delete('/:vehicle_id/loads/:load_id', (req, res) => {
  if (typeof req.header('authorization') === 'undefined') {
    res.status(401).end();
  }

  const tokenH = req.header('authorization').split(' ');
  const token = tokenH[1];
  const ticket = client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID
  }).then((ticket) => {
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    if (typeof userid === 'undefined') {
      res.status(403).json({
        'Error': 'Authorization token does not match user info.'
      });
    }

    get_vehicle(req.params.vehicle_id).then((vehicle) => {
      if (typeof vehicle === 'undefined') {
        res.status(404).send({
          'Error': 'No load with this load_id assigned to the vehicle with this vehicle_id'
        });
      }

      if (vehicle.owner === userid) {
        const load_key = datastore.key(['Load', parseInt(req.params.load_id, 10)]);
        const load = datastore.get(load_key).then( load => {
          if (typeof load[0] === 'undefined') {
            res.status(404).send({
              'Error': 'The specified vehicle and/or load does not exist'
            });
          }

          if (load[0].carrier === req.params.vehicle_id) {
            remove_load(vehicle, req.params.vehicle_id, load[0], req.params.load_id).then(() => {
              res.status(204).end();
            });
          } else {
            res.status(404).send({
              'Error': 'No load with this load_id assigned to the vehicle with this vehicle_id'
            });
          }
        });
      }
    });
  }).catch((error) => {
    res.status(401).end();
  });
});

/* =============== End of Controller Functions =============== */

// export module
module.exports = router;