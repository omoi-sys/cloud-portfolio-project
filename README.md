# Oregon State University CS493 Cloud Application Development Portfolio Project
Final project, an API with following operations:

- Add a vehicle
- Get a vehicle
- Get all vehicles owned by user
- Get all loads of a vehicle
- Update vehicle
- Assign a load to a vehicle
- Removed a load from a vehicle
- Delete a vehicle

All of the above are protected by a token check. A JWT is provided on the front-end to use.

- Add a load
- Get a load
- Get all loads
- Update a load
- Delete a load

The load endpoints do not need a token to use.

## Data Models
Users
|id|auth_id|
|--|-------|
|1213|622321|

Vehicles
|id|make|model|type|capacity|owner|loads|
|--|----|-----|----|--------|-----|-----|
|1928|Honda|CR-V|SUV|1500|8271|[{"id": "13223"}]|

Loads
|id|weight|carrier|content|creation_date|
|--|------|-------|-------|-------------|
|3112|100|{"id": "1928"}|"Computer parts"|"06/06/2021"|

## Use
This project is made to run in Google Cloud's App Engine. It requires the Cloud Build API and Google People API.
As this project use dotenv to manage environmental variables, first make a .env file and add:
```
CLIENT_ID=
CLIENT_SECRET=
SCOPE=https://www.googleapis.com/auth/userinfo.profile
REDIRECT_URI=
```
The values of these variables can be obtained when adding OAuth credentials to a GCP project. After these variables are set, run
```
gcloud app deploy
```
To follow the set up process.

To run locally:
```
npm install
npm start
```

However for this to work properly, localhost:8080 must be added to the OAuth credential settings in the GCP project under API & Services.