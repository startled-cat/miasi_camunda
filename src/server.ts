const CAMUNDA_REST_URL = 'http://localhost:8080/engine-rest';
const CAMUNDA_PROCESS_NAME = 'payment-retrival';

const camundaRestResources = {
    startProcess: CAMUNDA_REST_URL + '/process-definition/key/' + CAMUNDA_PROCESS_NAME + '/start',
}

// -------------------------------------------------
// ------------ camunda service -------------
// -------------------------------------------------

const camundaResponses:any[] = [];

// const {
//     Client,
//     logger
// } = require('camunda-external-task-client-js');

import {Client, logger} from 'camunda-external-task-client-js'

const config = {
    baseUrl: CAMUNDA_REST_URL,
    use: logger,
    asyncResponseTimeout: 10000
};

const client = new Client(config);

client.subscribe('response-positive', async function ({
    task,
    taskService
}) {
    console.log(`To dobrze`);
    camundaResponses.push({msg: "To dobrze", when: new Date().toISOString()});
    await taskService.complete(task);
});

client.subscribe('response-negative', async function ({
    task,
    taskService
}) {
    console.log(`To źle`);
    camundaResponses.push({msg: "To źle", when: new Date().toISOString()});
    await taskService.complete(task);
});






// -------------------------------------------------





const PORT = 80;
import express from 'express';

const app = express();
const got = require('got');

app.get('/hello', function (req: any, res: any) {
    res.send('Hello World');
})

app.get('/messages', (req: any, res: any) => {
    res.send({messages : camundaResponses});
})
app.post('/start', async (req: any, res: any) => {
    console.log('/start');
    let camundaStartProcessRequest = {
        "variables": {
            "amount": {
                "value": 555,
                "type": "long"
            },
            "item": {
                "value": "item-xyz"
            },
            "response": {
                "type" : "boolean",
                "value": true
            }
        }
    };

    try {
        const response = await got(camundaRestResources.startProcess, {
            method: "POST",
            json: camundaStartProcessRequest
        });
        console.log(response.body);
        res.send(response.body);
        //=> '<!doctype html> ...'
    } catch (error) {
        console.log(error.response.body);
        res.send(error.response.body);
        //=> 'Internal server error ...'
    }

    // now send post request with this body to camundaRestResources.startProcess


})

app.use(express.static('./static'));

const server = app.listen(PORT, function () {
    console.log(`frontend listening at ${PORT}`);
})