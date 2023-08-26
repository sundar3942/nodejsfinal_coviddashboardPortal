const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

let db = null;
const dbPath = path.join(__dirname, "covid19IndiaPortal.db");

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server getting started");
    });
  } catch (e) {
    console.log(`Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

let convertDBObject = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};
let convertDBObject_district = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};
let convertDBObject_stats = (object) => {
  return {
    totalCases: object.totalCases,
    totalCured: object.totalCured,
    totalActive: object.totalActive,
    totalDeaths: object.totalDeaths,
  };
};
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const userQuery = `SELECT * FROM user where username = '${username}';`;
  const dbUser = await db.get(userQuery);
  console.log(dbUser);
  if (dbUser !== undefined) {
    const passwordMatched = await bcrypt.compare(password, dbUser.password);
    if (passwordMatched) {
      console.log("success");
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "secret_key");
      response.status(200);
      response.send({ jwtToken });
      console.log({ jwtToken });
    } else {
      console.log("password failed");
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

app.get("/states/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secret_key", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const query = `
    SELECT * from state;
    `;
        const statesDetails = await db.all(query);
        console.log(statesDetails);
        const converted = statesDetails.map((eachObj) =>
          convertDBObject(eachObj)
        );
        response.send(converted);
      }
    });
  }
});

app.get("/states/:stateId/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  console.log(jwtToken);
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secret_key", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const { stateId } = request.params;
        const query = `
        SELECT * from state WHERE state_id= ${stateId};
    `;
        const dbResponse = await db.get(query);
        console.log(dbResponse);
        const converted = convertDBObject(dbResponse);
        response.send(converted);
        console.log(converted);
      }
    });
  }
});

app.get("/districts/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secret_key", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const query = `
    SELECT * from district;
    `;
        const districtDetails = await db.all(query);

        const converted = districtDetails.map((eachObj) =>
          convertDBObject_district(eachObj)
        );
        console.log(converted);
        response.send(converted);
      }
    });
  }
});
app.get("/districts/:districtId/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secret_key", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const { districtId } = request.params;
        console.log(districtId);
        const query = `
        SELECT * from district WHERE district_id=${districtId};
    `;
        const dbResponse = await db.get(query);
        const converted = convertDBObject_district(dbResponse);
        response.send(converted);
      }
    });
  }
});
app.post("/districts/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secret_key", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const districtDetails = request.body;
        const {
          districtName,
          stateId,
          cases,
          cured,
          active,
          deaths,
        } = districtDetails;
        const postQuery = `INSERT INTO district (
        district_name,state_id,cases,cured,active,deaths)
        VALUES(
           '${districtName}',${stateId},${cases},${cured},${active},${deaths}
            );`;
        const dbResponse = await db.run(postQuery);
        response.send("District Successfully Added");
      }
    });
  }
});

app.delete("/districts/:districtId/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secret_key", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const { districtId } = request.params;
        const deleteQuery = `
    DELETE FROM
      district
    WHERE
      district_id = ${districtId};`;
        await db.run(deleteQuery);
        response.send("District Removed");
      }
    });
  }
});

app.put("/districts/:districtId/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    const { districtId } = request.params;
    const districtDetails = request.body;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = districtDetails;

    const putQuery = `UPDATE district 
    SET district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    
    WHERE district_id = ${districtId}
    `;
    const dbResponse = await db.run(putQuery);
    console.log(dbResponse);
    response.send("District Details Updated");
  }
});

app.get("/states/:stateId/stats/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  console.log(jwtToken);
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secret_key", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const { stateId } = request.params;
        const query = `
        select sum(cases) as totalCases,sum(cured) as totalCured,sum(active) as totalActive,sum(deaths) as totalDeaths from district 
where state_id = ${stateId};
    `;
        const dbResponse = await db.get(query);
        const converted = convertDBObject_stats(dbResponse);
        response.send(converted);
      }
    });
  }
});

module.exports = app;
