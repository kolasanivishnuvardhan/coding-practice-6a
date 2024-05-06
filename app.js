const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const convertResponseIntoRequiredResponseForApi1 = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertResponseIntoRequiredResponseForApi4 = dbObject => {
  return {
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

// initialize db and server
let db = null
const dbPath = path.join(__dirname, 'covid19India.db')
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('server started')
    })
  } catch (e) {
    console.log(`ERROR : ${e.message}`)
  }
}

initializeDbAndServer()

// api 1 Returns a list of all states in the state table
app.get('/states/', async (request, response) => {
  const getStatesQuery = `
  select 
    *
  from
    state;
  ;`
  const statesArray = await db.all(getStatesQuery)
  response.send(
    statesArray.map(eachState =>
      convertResponseIntoRequiredResponseForApi1(eachState),
    ),
  )
}) // api 1 completed successfully

// api 2 Returns a state based on the state ID

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  select
    *
  from
    state
  where state_id = ${stateId};
  `
  const state = await db.get(getStateQuery)
  response.send(convertResponseIntoRequiredResponseForApi1(state))
}) //api 2 is successfully completed

// api 3 Create a district in the district table, `district_id` is auto-incremented

app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const insertDistrictQuery = `
  insert into district(district_name,state_id,cases,cured,active,deaths)
  values('${districtName}',${stateId},${cases},${cured},${active},${deaths});
  `
  await db.run(insertDistrictQuery)
  response.send('District Successfully Added')
}) // api 3 successfully completed

//api 4 Returns a district based on the district ID
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
  select
    *
  from
    district
  where
    district_id = ${districtId};
  `
  const district = await db.get(getDistrictQuery)
  response.send(convertResponseIntoRequiredResponseForApi4(district))
}) //api 4 successfully completed

// api 5 Deletes a district from the district table based on the district ID

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  delete from district
    where district_id = ${districtId};
  `
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
}) //api 5 successfully completed

// api 6 Updates the details of a specific district based on the district ID

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails

  const updateDistrictQuery = `
  update district set 
  district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  where
    district_id = ${districtId};
  `

  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
}) //api 6 successfully completed

// api 7 Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
/*response : {
  totalCases: 724355,
  totalCured: 615324,
  totalActive: 99254,
  totalDeaths: 9777
}*/

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getstatisticsQuery = `

  select
    sum(d.cases) as totalCases,
    sum(d.cured) as totalCured,
    sum(d.active) as totalActive,
    sum(d.deaths) as totalDeaths
  from
    state as s inner join district as d on s.state_id = d.state_id
  where
    s.state_id = ${stateId};
  `
  const statistics = await db.get(getstatisticsQuery)
  response.send(statistics)
}) // api 7 successfully completed

// api 8 Returns an object containing the state name of a district based on the district ID

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateNameQuery = `
    select
      s.state_name as stateName
    from
      state as s inner join district as d on s.state_id = d.state_id
    where
      d.district_id = ${districtId};  
      `
  const stateName = await db.get(getStateNameQuery)
  response.send(stateName)
})// api 8 done

module.exports = app;