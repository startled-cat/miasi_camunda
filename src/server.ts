const CAMUNDA_REST_URL = "http://localhost:8080/engine-rest";

const camundaRestResources = {
  message: CAMUNDA_REST_URL + "/message",
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

    console.log(`Validating first name: "${firstName}"`);
    console.log(`Validating last name: "${lastName}"`);

    if (firstName.length < 3 || lastName.length < 3)
      console.log("Error handling not implemented yet");

    // camundaResponses.push({ msg: "To dobrze", when: new Date().toISOString() });
    await taskService.complete(task);
  }
);

// -------------------------------------------------

const PORT = 80;
import express from "express";
import cors from 'cors';

const app = express();
const got = require("got");

app.use(cors());
app.use(express.static("./static"));
app.use(express.json());

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
    let newProcessId = response.body[0].processInstance.id;
    console.log(`new process started, id = ${newProcessId}`);
    res.send({ id: newProcessId });
  } catch (error) {
    console.error('failed to start new process');
    res.status(500).send({ id: null });
  }
});

app.post("/submitClientData", async (req: any, res: any) => {
  const payload = {
    messageName: "clientDataMessage",
    processInstanceId: req.body.id,
    processVariables: {
      firstName: { value: req.body.firstName, type: "String" },
      lastName: { value: req.body.lastName, type: "String" },
    },
    resultEnabled: true,
  };

  try {
    const response = await got(camundaRestResources.message, {
      method: "POST",
      json: payload,
      responseType: "json",
    });
    console.log('client data submitted');
    res.send({});
  } catch (error) {
    console.error('failed to submit client data');
    res.status(500).send({});
  }
});

const server = app.listen(PORT, function () {
  console.log(`frontend listening at ${PORT}`);
});
