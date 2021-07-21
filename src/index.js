const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const neo4j = require("neo4j-driver");
require("dotenv").config();
const URI = process.env.URI;
const USER = "neo4j";
const PASSWORD = process.env.PASS;
const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
const session = driver.session();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
// parse application/json
app.use(bodyParser.json());

app.post("/items", async (req, res) => {
  console.log("I am called with", req.body);
  let params = req.body;
  let values = {
    name: params["name"],
    image: params["image"],
    type: params["type"]
  };

  if (params["releaseYear"] != null && params["releaseYear"].length > 1) {
    values["releaseYear"] = params["releaseYear"];
  } else {
    values["releaseYear"] = 0;
  }
  if (params["location"] != null) {
    values["location"] = params["location"];
  } else {
    values["location"] = "-";
  }

  if (params["countryOfOrigin"] != null) {
    values["countryOfOrigin"] = params["countryOfOrigin"];
  } else {
    values["countryOfOrigin"] = "-";
  }

  if (params["hasTags"]) {
    values["tags"] = params["tags"];

    try {
      const result = await session.run(
        "MERGE (i:Item{id: randomUUID(), name: $name, image:$image, type: $type, releaseYear: $releaseYear, location: $location, countryOfOrigin: $countryOfOrigin}) with i, $tags as tagcoll unwind tagcoll as tag merge(t:Tag{name: tag}) with i, t Merge(i)-[:HAS_TAG]->(t) RETURN i.name AS name",
        values
      );
      result.records.forEach((r) => console.log(r.get("name")));
      console.log("query completed");
      res.send("All done");
    } finally {
      console.log("all done");
    }
  } else {
    try {
      const result = await session.run(
        "MERGE (i:Item{id: randomUUID(), name: $name, image:$image, type: $type, releaseYear: $releaseYear, location: $location, countryOfOrigin: $countryOfOrigin})  RETURN i.name AS name",
        values
      );
      result.records.forEach((r) => console.log(r.get("name")));
      console.log(" query completed");

      res.send("All done");
    } finally {
      console.log("add done");
    }
  }
});

app.get("/items", async (req, res) => {
  // let skip = parseInt(req.params.skip, 10);
  let data = [];
  try {
    const result = await session.readTransaction((tx) =>
      tx.run("MATCH (i:Item) RETURN i ORDER BY i.name ")
    );

    const records = result.records;
    for (let i = 0; i < records.length; i++) {
      const val = records[i].get(0);
      data.push(val.properties);
    }
    res.send(JSON.stringify(data));
  } finally {
    console.log("done");
  }
});

app.listen(3000, () => {
  console.log(`Example app listening on 3000`);
});
