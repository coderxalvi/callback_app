const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = "23e333d956faf200886cbecf02ca0490";
const callbackUrlFile = path.join(__dirname, "callbackUrl.txt");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // To parse form data

// Function to read the callback URL from the file
const readCallbackUrl = () => {
  try {
    if (fs.existsSync(callbackUrlFile)) {
      return fs.readFileSync(callbackUrlFile, "utf8");
    }
  } catch (err) {
    console.error("Error reading callback URL from file:", err);
  }
  return "";
};

// Function to write the callback URL to the file
const writeCallbackUrl = (url) => {
  try {
    fs.writeFileSync(callbackUrlFile, url, "utf8");
  } catch (err) {
    console.error("Error writing callback URL to file:", err);
  }
};

let callbackUrl = readCallbackUrl(); // Load the callback URL from the file when the app starts

/* connection establishment */
app.get("/", (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Set Callback URL</h1>
        <form action="/" method="post">
          <label for="callbackUrl">Callback URL:</label>
          <input type="text" id="callbackUrl" name="callbackUrl" required>
          <button type="submit">Submit</button>
        </form>
        <p>Current Callback URL: ${callbackUrl || "Not set"}</p>
      </body>
    </html>
  `);
});

app.post("/", (req, res) => {
  callbackUrl = req.body.callbackUrl;
  writeCallbackUrl(callbackUrl); // Save the callback URL to the file
  res.send(`Callback URL set to: ${callbackUrl}`);
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

  if (!callbackUrl) {
    res.status(400).send("Callback URL is not set.");
    return;
  }

  // Forward the event to the stored callback URL
  axios
    .post(callbackUrl, event, {
      headers: {
        "Content-Type": "application/json",
      },
      httpsAgent: new require("https").Agent({ rejectUnauthorized: false }),
    })
    .then((response) => {
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
