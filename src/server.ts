const CAMUNDA_REST_URL = "http://localhost:8080/engine-rest";
const CAMUNDA_PROCESS_NAME = "payment-retrival";

const camundaRestResources = {
  message: CAMUNDA_REST_URL + "/message",
  startProcess:
    CAMUNDA_REST_URL +
    "/process-definition/key/" +
    CAMUNDA_PROCESS_NAME +
    "/start",
};

// -------------------------------------------------
// ------------ camunda service -------------
// -------------------------------------------------

const camundaResponses: any[] = [];

// const {
//     Client,
//     logger
// } = require('camunda-external-task-client-js');

import { Client, logger } from "camunda-external-task-client-js";

const config = {
  baseUrl: CAMUNDA_REST_URL,
  use: logger,
  asyncResponseTimeout: 10000,
};

const client = new Client(config);

client.subscribe(
  "validate-client-data",
  async function ({ task, taskService }) {
    const firstName: String = task.variables.get("firstName");
    const lastName: String = task.variables.get("lastName");

    if (firstName.length < 3 || lastName.length < 3)
      console.log("Error handling not implemented yet");

    // camundaResponses.push({ msg: "To dobrze", when: new Date().toISOString() });
    await taskService.complete(task);
  }
);

// -------------------------------------------------

const PORT = 80;
import express from "express";

const app = express();
const got = require("got");

app.get("/hello", function (req: any, res: any) {
  res.send("Hello World");
});

app.get("/messages", (req: any, res: any) => {
  res.send({ messages: camundaResponses });
});

app.get("/confirmCartContents", async (req: any, res: any) => {
  const payload = {
    messageName: "newOrderMessage",
    resultEnabled: true,
  };

  try {
    const response = await got(camundaRestResources.message, {
      method: "POST",
      json: payload,
      responseType: "json",
    });
    res.send({ id: response.body[0].processInstance.id });
  } catch (error) {
    res.status(500).send({ id: null });
  }
});

app.use(express.static("./static"));

const server = app.listen(PORT, function () {
  console.log(`frontend listening at ${PORT}`);
});
