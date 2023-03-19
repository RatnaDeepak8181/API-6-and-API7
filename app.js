const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error.${error.message}`);
  }
};
initializeDBAndServer();

const convertDbObjectTOResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerDetailsQuery = `
        SELECT
            *
        FROM
            player_details;`;
  const playersArray = await database.all(getPlayerDetailsQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectTOResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayer = `
        SELECT
            *
        FROM
            player_details
        WHERE 
            player_id = ${playerId};`;
  const playerObject = await database.get(getSpecificPlayer);
  response.send(convertDbObjectTOResponseObject(playerObject));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerDetails = `
        UPDATE
            player_details
        SET
            player_name = '${playerName}';`;
  await database.run(updatePlayerDetails);
  response.send("Player Details Updated");
});

const convertDBObjectTOResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getSpecificMatchDetailsQuery = `
        SELECT
            *
        FROM
            match_details
        WHERE
            match_id = ${matchId};`;
  const specificMatch = await database.get(getSpecificMatchDetailsQuery);
  response.send(convertDBObjectTOResponseObject(specificMatch));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchDetails = `
        SELECT
            *
        FROM
            player_match_score
        NATURAL JOIN match_details
        WHERE
            player_id = ${playerId};`;
  const matchObject = await database.all(getMatchDetails);
  response.send(
    matchObject.map((eachPlayerMatch) =>
      convertDBObjectTOResponseObject(eachPlayerMatch)
    )
  );
});

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getSpecificPlayerMatchDetails = `
        SELECT
            *
        FROM
            player_details
        LEFT JOIN player_match_score
        on player_details.player_id = player_match_score.player_id
        WHERE player_match_score.match_id = ${matchId};`;
  const players = await database.all(getSpecificPlayerMatchDetails);
  response.send(convertDBObjectTOResponseObject(players));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerScoresQuery = `
    SELECT 
      player_details.player_id AS playerId,
      player_details.player_name AS playerName,
      SUM(player_match_score.score) AS totalScore,
      SUM(player_match_score.fours) AS totalFours,
      SUM(player_match_score.sixes) AS totalSixes
    FROM 
      player_details INNER JOIN player_match_score 
      ON player_details.player_id = player_match_score.player_id 
    WHERE 
      player_details.player_id = ${playerId};`;

  const playerScores = await database.get(playerScoresQuery);
  response.send(playerScores);
});

module.exports = app;
