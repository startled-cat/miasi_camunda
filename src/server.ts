const CAMUNDA_REST_URL = 'http://localhost:8080/engine-rest';

const camundaRestResources = {
  message: CAMUNDA_REST_URL + '/message',
};


export interface UserDataValidation {
  id: string;
  valid: boolean;
}
var userDataValidation: UserDataValidation[] = [];

// -------------------------------------------------
// ---------------- camunda service ----------------
// -------------------------------------------------

const camundaResponses: {
  msg: string;
  when: Date;
  id: string;
}[] = [];
const warehouseOrders: {
  id: string;
  sent: boolean;
}[] = [];

import { Client, logger } from 'camunda-external-task-client-js';

const config = {
  baseUrl: CAMUNDA_REST_URL,
  use: logger,
  asyncResponseTimeout: 10000,
};

const client = new Client(config);

client.subscribe(
  'validate-client-data',
  async function ({ task, taskService }) {
    let validation: UserDataValidation

    const firstName: String = task.variables.get('firstName');
    const lastName: String = task.variables.get('lastName');

    console.log(`Validating first name: "${firstName}"`);
    console.log(`Validating last name: "${lastName}"`);

    if (firstName.length < 3 || lastName.length < 3) {
      validation = { id: '' + task.processInstanceId, valid: false };
      userDataValidation.push(validation);
      await taskService.handleBpmnError(task, "validationError");
    } else {
      validation = { id: '' + task.processInstanceId, valid: true };
      userDataValidation.push(validation);
      await taskService.complete(task);
    }

  }
);

client.subscribe(
  'update-order-state-after-payment',
  async ({ task, taskService }) => {
    const providerMsg: String = task.variables.get('msg');
    console.log(`Provider message ${providerMsg}`);
    console.log('update-order-state-after-payment');
    console.log('... brr, updating order state in some database');
    console.log('... and sending notification to user');
    camundaResponses.push({
      msg: `payment has been accepted`,
      when: new Date(),
      id: '' + task.processInstanceId,
    });
    await taskService.complete(task);
  }
);

client.subscribe('send-order-to-warehouse', async ({ task, taskService }) => {
  console.log('send-order-to-warehouse');
  console.log('... brr sending order to warehouse, and updating database');
  let order = {
    id: task.processInstanceId + '',
    sent: false,
  };
  warehouseOrders.push(order);
  // updating databse, maybe later
  await taskService.complete(task);
});

client.subscribe(
  'update-order-state-after-shipment',
  async ({ task, taskService }) => {
    console.log('update-order-state-after-shipment');
    console.log('... brr updating order state in database');

    let order = warehouseOrders.find(
      (order) => order.id == task.processInstanceId
    );
    if (order) {
      console.log('... warehouse order marked as sent');
      order.sent = true;
    } else {
      console.log('... couldnt not find warehouse order');
    }

    console.log('... and sending notification to user');
    camundaResponses.push({
      msg: `order has been sent`,
      when: new Date(),
      id: '' + task.processInstanceId,
    });
    await taskService.complete(task);
  }
);

client.subscribe(
  'redirect-client-to-payment-provider',
  async ({ task, taskService }) => {
    const paymentMethod: String = task.variables.get('paymentMethod');

    console.log('redirect-client-to-payment-provider');
    console.log(
      `... brr redirecting client to payment provider. Chosen method: ${paymentMethod}`
    );

    await taskService.complete(task);
  }
);

//delays

client.subscribe(
  'realization_delay_notification',
  async ({ task, taskService }) => {
    console.log('realization_delay_notification');
    console.log('... brr order realization is delayed, notify client');

    //might use later
    // let order = warehouseOrders.find(
    //   (order) => order.id == task.processInstanceId
    // );

    // what is this
    const providerMsg: String = task.variables.get('msg');
    console.log(`Provider message ${providerMsg}`);
    camundaResponses.push({
      msg: `DELAY, order realization is delayed, please be patient`,
      when: new Date(),
      id: '' + task.processInstanceId,
    });

    await taskService.complete(task);
  }
);

// -------------------------------------------------
// -------------------- express --------------------
//  (for interaction between frontend and camunda)
//           (and hosting frontedn ofc)
// -------------------------------------------------

const PORT = 80;
import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';

const app = express();
const got = require('got');

app.use(cors());
app.use(express.static('./static'));
app.use(express.json());

app.get('/hello', function (req: any, res: any) {
  res.send('Hello World');
});

app.get('/messages', (req: any, res: any) => {
  res.send({ messages: camundaResponses });
});

app.get('/warehouse/orders', (req: any, res: any) => {
  res.send({ orders: warehouseOrders });
});

app.post('/warehouse/realiseorder', async (req: any, res: any) => {
  console.log('/warehouse/realiseorder');

  const payload = {
    messageName: 'orderSentConfirmation',
    processInstanceId: req.body.id,
    resultEnabled: true,
  };
  console.log(payload);

  try {
    const response = await got(camundaRestResources.message, {
      method: 'POST',
      json: payload,
      responseType: 'json',
    });
    console.log(`orderSentConfirmation success`);
    res.send({ id: req.body.id });
  } catch (error) {
    console.error('failed to orderSentConfirmation');
    console.error(error);
    res.status(500).send({ id: null });
  }
});

app.get('/confirmCartContents', async (req: any, res: any) => {
  const payload = {
    messageName: 'newOrderMessage',
    resultEnabled: true,
  };

  try {
    const response = await got(camundaRestResources.message, {
      method: 'POST',
      json: payload,
      responseType: 'json',
    });
    let newProcessId = response.body[0].processInstance.id;
    console.log(`new process started, id = ${newProcessId}`);
    res.send({ id: newProcessId });
  } catch (error) {
    console.error('failed to start new process');
    res.status(500).send({ id: null });
  }
});

app.post('/payment', async (req: any, res: any) => {
  const payload = {
    messageName: 'clientDataMessage',
    processInstanceId: req.body.id,
    processVariables: {
      paymentMethod: { value: req.body.paymentMethod, type: 'String' },
    },
    resultEnabled: true,
  };

  try {
    await got(camundaRestResources.message, {
      method: 'POST',
      json: payload,
      responseType: 'json',
    });

    console.log('Payment method submited');
    res.send({});
  } catch (error) {
    console.error('failed to submit payment method');
    console.error(error);
    res.status(500).send({ error: error });
  }
});

app.post('/payment/provider', async (req: any, res: any) => {
  const payload = {
    messageName: 'paymentReceived',
    processInstanceId: req.body.id,
    processVariables: {
      paymentProviderMessage: { value: req.body.msg, type: 'String' },
    },
    resultEnabled: true,
  };

  try {
    await got(camundaRestResources.message, {
      method: 'POST',
      json: payload,
      responseType: 'json',
    });

    console.log('Payment tamagucci');
    res.send({});
  } catch (error) {
    console.error('failed to submit payment method');
    console.error(error);
    res.status(500).send({ error: error });
  }
});

app.post('/submitClientData', async (req: any, res: any) => {
  const payload = {
    messageName: 'clientDataMessage',
    processInstanceId: req.body.id,
    processVariables: {
      firstName: { value: req.body.firstName, type: 'String' },
      lastName: { value: req.body.lastName, type: 'String' },
    },
    resultEnabled: true,
  };

  try {
    const response = await got(camundaRestResources.message, {
      method: 'POST',
      json: payload,
      responseType: 'json',
    });
    console.log('client data submitted');
    res.send({});
  } catch (error) {
    console.error('failed to submit client data');
    console.error(error);
    res.status(500).send({ error: error });
  }
});

app.post('/isuserdatavalidated', (req, res) => {
  let processInstanceId = req.body.id;

  console.log(userDataValidation);
  console.log('processInstanceId = ', processInstanceId);

  let validation/*:UserDataValidation*/ = userDataValidation.find(v => v.id === processInstanceId);

  if (validation) {

    if (validation.valid) {
      res.status(200).send({ valid: true })
    } else if (!validation.valid) {
      res.status(400).send({ valid: false })
    }

    //clear entry
    userDataValidation = userDataValidation.filter(v => v.id !== processInstanceId);

  } else {
    res.status(500).send(null);

  }



})

const server = app.listen(PORT, function () {
  console.log(`frontend listening at ${PORT}`);
});
