const express = require('express');
const mqtt = require('mqtt');

const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const app = express();
//app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/*+json' }));

let messages = [];


const mqttBrokerUrl = 'mqtt://localhost:1883';
const daprPort = 3500; // Dapr HTTP Port
const client = mqtt.connect(mqttBrokerUrl);

client.on('connect', () => {
    console.log("Connected to MQTT broker");
    client.subscribe('sensor-data', (err) => {
        if (!err) {
            console.log("Subscribed to 'sensor-data' topic");
        }
    });
});

client.on('message', (topic, message) => {
    console.log("Message received from MQTT: ", message.toString());
    console.log(JSON.stringify({
            operation: "create",
            data: message.toString()
        }));

    fetch(`http://localhost:${daprPort}/v1.0/publish/message-queue/sensor-data`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            operation: "create",
            data: message.toString()
        })
    }).then(d => {
			console.log(d)
		})
});


app.post('/messagehandler', async (req, res) => {
  console.log("Message received: ", req.body);
  //await new Promise(r => setTimeout(r, 20000));
  messages.push(req.body);

  rb = JSON.parse(req.body.data["data"]);
  const measurements = Object.keys(rb);
  console.log("measurements",measurements);

  try {
    for (const measurement of measurements) {
      console.log("dsss ",rb[measurement]);
      //temp = JSON.parse(rb[measurement]);
      temp = rb[measurement];
      const keys = Object.keys(temp);
      var st = "";
      for (const k of keys) {
	st = st + k +"="+temp[k] + ","
      }
	st=st+"data=0";
      const data = {
        operation: "create",
        data: {
          measurement: measurement,
	  tags: `room="office"`,
          values:  st
	
        }
      };

      console.log(JSON.stringify(data));
      const response = await fetch('http://localhost:3500/v1.0/bindings/influxdb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
        //body: data
      });

      console.log(`Data sent to InfluxDB for measurement ${measurement}: `, response.status);
      response.text().then((response) => {
       console.log(response)
    })
  }
}
    catch (error) {
    console.error('Error sending data to InfluxDB: ', error);
  }

  res.sendStatus(200);
});




const port = 3000;

app.listen(port, () => console.log(`Node App listening on port ${port}!`));




