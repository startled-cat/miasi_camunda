const {
    Client,
    logger
} = require('camunda-external-task-client-js');
const open = require('open');

const config = {
    baseUrl: 'http://localhost:8080/engine-rest',
    use: logger,
    asyncResponseTimeout: 10000
};

const client = new Client(config);

client.subscribe('response-positive', async function ({
    task,
    taskService
}) {
    console.log(`To dobrze`);
    await taskService.complete(task);
});

client.subscribe('response-negative', async function ({
    task,
    taskService
}) {
    console.log(`To źle`);
    await taskService.complete(task);
});
