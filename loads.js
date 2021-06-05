const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

const ds = require('./datastore');
const datastore = ds.datastore;

router.use(bodyParser.json());

const link = 'https://serratab-portfolio.wl.r.appspot.com';
//const link = 'localhost:8080';

const LOAD = 'Load';

/* =============== Start of Model Functions =============== */

// Add a load
post_load = (weight, content) => {
    let key = datastore.key(LOAD);
    const new_load = { 'weight': weight, 'carrier': null, 'content': content, 'creation_date': global_date };
    return datastore.save({ 'key': key, 'data': new_load }).then(() => {
      let entity = {
        'id': key.id,
        'weight': weight,
        'carrier': null,
        'content': content,
        'creation_date': global_date,
        'self': link + '/loads/' + key.id.toString()
      }
      return entity;
    });
}
  
// Get a specific load
get_load = (load_id) => {
  const key = datastore.key([LOAD, parseInt(load_id, 10)]);
  return datastore.get(key).then((data) => {
    return data[0];
  });
}
  
// All loads with next cursor
get_loads = (req) => {
  let query = datastore.createQuery(LOAD).limit(5);
  let results = {};
  if(Object.keys(req.query).includes('cursor')) {
    query = query.start(req.query.cursor);
  }
  return datastore.runQuery(query).then((entities) => {
    results.loads = entities[0].map(ds.fromDatastore);
    if(entities[1].moreResults != ds.Datastore.NO_MORE_RESULTS) {
      results.next = req.protocol + '://' + req.get('host') + req.baseUrl + '?cursor=' + entities[1].endCursor;
    }
    return results;
  });
}

// Update load through PATCH
patch_load = (load_id, load, body) => {
  const key = datastore.key([LOAD, parseInt(load_id, 10)]);
  let up_load = {};
  if (typeof body.weight === 'undefined') {
    up_load.name = load.name;
  } else {
    up_load.name = body.name;
  }
  
  if (typeof body.content !== 'undefined') {
    up_load.type = body.type;
  } else {
    up_load.type = load.type;
  }
  
  up_load.carrier = load.carrier;
  up_load.creation_date = load.creation_date;
  
  return datastore.save({ 'key': key, 'data': up_load });
}

// Update load through PUT
put_load = (load_id, weight, content, load) => {
  const key = datastore.key([LOAD, parseInt(load_id, 10)]);
  const up_load = {
    'weight': weight, 
    'content': content, 
    'carrier': load.carrier,
    'creation_date': load.creation_date
  };
  return datastore.save({ 'key': key, 'data': up_load });
}
  
  
// Delete load while updating carrier if not null
delete_load = (load_id, load) => {
  const key = datastore.key([LOAD, parseInt(load_id, 10)]);
  if (load.carrier !== null) {
    const bkey = datastore.key(['Vehicle', parseInt(load.carrier.id, 10)]);
    datastore.get(bkey).then(vehicle => {
      for(let i = 0; i < vehicle[0].loads.length; i++) {
        if (vehicle[0].loads[i].id === load_id) {
          vehicle[0].loads.splice(i, 1);
          break;
        }
      }
      let vehicle_data = {
        "name": vehicle[0].name,
        "type": vehicle[0].type,
        "length": vehicle[0].length,
        "loads": vehicle[0].loads
      };
      datastore.save({ 'key': bkey, 'data': vehicle_data });
    });
  }
  return datastore.delete(key);
}
  
/* =============== End of Model Functions ================= */
  
/* =============== Start of Controller Functions ============= */
  
// POST a new load
router.post('/', (req, res) => {
  if (Object.keys(req.body).length < 2) {
    res.status(400).send({"Error": "The request object is missing at least one of the required attributes"});
  } else {
    post_load(req.body.weight, req.body.content).then( entity => {
      res.status(201).send(entity);
    });
  }
});
  
// GET a specific load
router.get('/:load_id', (req, res) => {
  const load = get_load(req.params.load_id).then( entity => {
    if (typeof entity === 'undefined') {
      const message = { "Error": "No load with this load_id exists" }
      res.status(404).send(message);
    } else {
      if (entity.carrier !== null) {
        entity.carrier.self = link + '/vehicles/' + entity.carrier['id'];
      }
      data.self = link + '/loads/' + req.params.load_id.toString();
      res.status(200).json(data);
    }
  });
});
  
// GET all loads
router.get('/', (req, res) => {
  const accepts = req.accepts(['application/json', '*/*']);
  if (!accepts) {
    res.status(406).end();
  }

  const loads = get_loads(req).then( loads => {
    for(let i = 0; i < loads.loads.length; i++) {
      loads.loads[i].self = req.protocol + '://' + req.get('host') + req.baseUrl + '/' + loads.loads[i].id.toString();
    }
    res.status(200).json(loads);
  });
});
  
// DELETE a load
router.delete('/:load_id', (req, res) => {
  const load = get_load(req.params.load_id).then( entity => {
    if (typeof entity === 'undefined') {
      const message = { "Error": "No load with this load_id exists" };
      res.status(404).send(message);
    } else {
      delete_load(req.params.load_id, entity).then(res.status(204).end());
    }
  });
});

// export module
module.exports = router;