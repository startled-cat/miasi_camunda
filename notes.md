## Starting message process

POST http://localhost:8080/engine-rest/message

```json
{
	"messageName": "newOrderMessage",
	"resultEnabled": true
}
```

return value:

```json
[
  {
    "processInstance": {
      "id": "7249ec2c-afe9-11eb-93e4-0242ac110002"
    }
  }
]
```

## Sending shipment details

POST http://localhost:8080/engine-rest/message

```json
{
	"messageName": "shipmentDetailsMessage",
	"processInstanceId": "7249ec2c-afe9-11eb-93e4-0242ac110002",
	"processVariables":  {
		"firstName": {"value": "Janusz", "type": "String"},
		"lastName": {"value": "Kowalski", "type": "String"}
	},
	"resultEnabled": true
}
```