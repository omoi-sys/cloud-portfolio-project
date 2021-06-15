# Oregon State University CS493 Cloud Application Development Portfolio Project
Final project, an API with following operations:

- Get a User
- Add a vehicle
- Get a vehicle
- Get all vehicles owned by user
- Get all loads of a vehicle
- Update vehicle
- Assign a load to a vehicle
- Removed a load from a vehicle
- Delete a vehicle

All of the above are protected by a token check. A JWT is provided on the front-end /login endpoint to use as a bearer token, but a google account is required.
- Get all users
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
|1928|Honda|CR-V|SUV|1500|622321|[{"id": "3112"}]|

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

## Endpoints

### Users
#### Get a User
Bearer token: Required

Request
```http
GET /users/:user_id
```
Response example
```json
{
  "id": "12312",
  "auth_id": "7291922",
  "self": "https://app.url/users/12312"
}
```
#### Get all Users
Bearer token: Not Required

Request
```http
GET /users
```
Response example
```json
[
  {
    "id": "12312",
    "auth_id": "7291922",
    "self": "https://app.url/users/12312"
  }, {
    "id": "12313",
    "auth_id": "8721002",
    "self": "https://app.url/users/1213"
  }
]
```

### Vehicles
Bearer token: Required for all

#### Create a Vehicle
Request
```http
POST /vehicles
```
Request Body
```json
{
  "make": "Honda",
  "model": "CR-V",
  "type": "SUV",
  "capacity": 1500
}
```
Response example
```json
{
  "id": 98212,
  "make": "Honda",
  "model": "CR-V",
  "type": "SUV",
  "capacity": 1500,
  "owner": 12312,
  "loads": [],
  "self": "https://app.url/vehicles/98212"
}
```

#### Get a vehicle by id
Request
```http
GET /vehicles/:vehicle_id
```
Response example
```json
{
  "id": 98212,
  "make": "Honda",
  "model": "CR-V",
  "type": "SUV",
  "capacity": 1500,
  "owner": 12312,
  "loads": [],
  "self": "https://app.url/vehicles/98212"
}
```

#### Get all vehicles
Request
```http
GET /vehicles
```
Response example
```json
{
  "vehicles": [
    {
      "id": "1274",
      "make": "Honda",
      "model": "CR-V",
      "type": "SUV",
      "capacity": 1500,
      "owner": "12345",
      "loads": [],
      "self": "https://app.url/vehicles/1274"         
    },
    {
      "id": "3456",
      "make": "Ford",
      "model": "F-150",
      "type": "Pickup",
      "capacity": 2400,
      "owner": "12345",
      "loads": [
        {
          "id": "4451",
          "self": "https://app.url/loads/4451"
        }, {
          "id": "4241",
          "self": "https://app.url/loads/4241"
        }
      ],
      "self": "https://app.url/vehicles/3456"
    },
    {
      "id": "3212",
      "make": "Isuzu",
      "model": "NPR-HD",
      "type": "Truck",
      "capacity": 8500,
      "owner": "12345",
      "loads": [],
      "self": "https://app.url/vehicles/3212"
    },
    {
      "id": "5430",
      "make": "Toyota",
      "model": "Camry",
      "type": "Sedan",
      "capacity": 925,
      "owner": "12345",
      "loads": [],
      "self": "https://app.url/vehicles/5430"
    },
    {
      "id": "7584",
      "make": "Ford",
      "model": "Expedition",
      "type": "SUV",
      "capacity": 1700,
      "owner": "12345",
      "loads": [],
      "self": "https://app.url/vehicles/7584"
    }
  ],
  "next": "https://app.url/vehicles?cursor=1J34uyWAasdajh11a" 
}
```
Note: Only the vehicles owned by the authorized user will be displayed.

#### Update a vehicle's attribute(s)
Request
```http
PATCH /vehicles/:vehicle_id
```
Request body
```json
{
  "capacity": 1200
}
```
Response status code: `201`

#### Update a vehicle (all attributes required)
Request
```http
PUT /vehicles/:vehicle_id
```
Request body
```json
{
  "make": "Honda",
  "model": "CR-V",
  "type": "SUV",
  "capacity": 1200
}
```
Response status code: `303`

#### Delete a vehicle
Request
```http
DELETE /vehicles/:vehicle_id
```
Response status code: `204 No Content`

#### List all loads of a Vehicle
Request
```http
GET /vehicles/:vehicle_id/loads
```
Response example
```json
[
  {
    "id": "4451",
    "self": "https://app.url/loads/4451"
  }, {
    "id": "4241",
    "self": "https://app.url/loads/4241"
  }
]
```

#### Assign load to a vehicle
Request
```http
PUT /vehicles/:vehicle_id/loads/:load_id
```
Response status code: `204 No Content`

#### Remove load from a vehicle
Request
```http
DELETE /vehicles/:vehicle_id/loads/:load_id
```
Response status code: `204 No Content`

### Loads
Bearer token: Not Required for any

#### Create a Load
Request
```http
POST /loads
```
Request body
```json
{
  "weight": 10,
  "content": "Rice"
}
```
Response example
```json
{
  "id": "4451",
  "weight": 10,
  "carrier": null,
  "content": "Rice",
  "creation_date": "01/12/2021",
  "self": "https://app.url/loads/4451"
}
```
Creation time in UTC-0

#### Get a load
Request
```http
GET /loads/:load_id
```
Response example
```json
{
  "id": "4451",
  "weight": 10,
  "carrier": null,
  "content": "Rice",
  "creation_date": "01/12/2021",
  "self": "https://app.url/loads/4451"
}
```

#### List all loads
Request
```http
GET /loads
```
Response example
```json
{
  "loads": [
    {
      "id": "4451",
      "weight": 10,
      "carrier": {
        "id": "3456",
        "self": "https://app.url/vehicles/3456"
      },
      "content": "Rice",
      "creation_date": "01/12/2021",
      "self": "https://app.url/loads/4451"
    }, {
      "id": "4241",
      "weight": 15,
      "carrier": {
        "id": "3456",
        "self": "https://app.url/vehicles/3456"
      },
      "content": "Fruits",
      "creation_date": "12/14/2020",
      "self": "https://app.url/loads/4241"
    }, {
      "id": "5471",
      "weight": 30,
      "carrier": null,
      "content": "Beans",
      "creation_date": "03/12/2020",
      "self": "https://app.url/loads/4451"
    }, {
      "id": "2331",
      "weight": 100,
      "carrier": null,
      "content": "Table",
      "creation_date": "02/01/2020",
      "self": "https://app.url/loads/2331"
    }, {
      "id": "9845",
      "weight": 30,
      "carrier": null,
      "content": "Pineapples",
      "creation_date": "01/15/2020",
      "self": "https://app.url/loads/9845"
    }
  ],
  "next": "https://app.url/loads?cursor=7Ahs2k1asdAajh11a"
}
```

#### Update a load's attribute(s)
Request
```http
PATCH /loads/:load_id
```
Request body
```json
{
  "weight": 50
}
```
Response status code: `201 `

#### Update a load (all attributes required)
Request
```http
PUT /loads/:load_id
```
Request body
```json
{
  "weight": 50,
  "content": "Rice"
}
```
Response status code: `303`

#### Delete a Load
Request
```http
DELETE /loads/:load_id
```
Response status code: `204 No Content`
