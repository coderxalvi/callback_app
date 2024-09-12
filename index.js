const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = "23e333d956faf200886cbecf02ca0490";

app.use(bodyParser.json());

/* connection establishment */
app.get("/", (req, res, next) => {
  try {
    res.status(200).json({
      acknowledgement: true,
      message: "OK",
      description: "The request is OK",
    });
  } catch (err) {
    next(err);
  } finally {
    //console.log(`Route: ${req.url} || Method: ${req.method}`);
  }
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

app.post("/webhook", (req, res) => {
  const event = req.body;
  console.log("Received event:", event);
  // Forward the event to the Node.js app running on port 8081 as a JSON string
  axios
    .post(
      "https://1324-45-126-74-161.ngrok-free.app/v1/api/messaging-webhook",
      JSON.stringify(event),
      {
        headers: {
          "Content-Type": "application/json",
        },
        httpsAgent: new require("https").Agent({ rejectUnauthorized: false }),
      }
    ).then((response) => {
      console.log("Event forwarded successfully:", response.data);
      res.sendStatus(200);
    })
    .catch((error) => {
      console.error("Error forwarding event:", error);
      res.sendStatus(500);
    });
});

app.listen(PORT, () => {
  console.log(`Webhook receiver app listening on port ${PORT}`);
});
