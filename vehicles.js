const express = require('express');
const router = express.Router();

const ds = require('./datastore');
const datastore = ds.datastore;

const VEHICLE = 'Vehicle';

// Get a vehicle with its id
get_vehicle = (vehicle_id) => {
  const key = datastore.key([VEHICLE, parseInt(vehicle_id, 10)]);
  return datastore.get(key);
}

// Get all vehicles
get_vehicles = (req) => {
  let query = datastore.createQuery(VEHICLE).
}