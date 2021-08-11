require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const nunjucks = require("nunjucks");
const app = express();

const http = require('http');
const WebSocket = require('ws');
const cookie = require('cookie');
const server = http.createServer(app);

const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

const mongoConnector = require('./functions/mongoConnector');
const senderWS = require('./functions/senderWS');
const wssHandler = require('./functions/wssHandler');
const { ObjectId } = require("mongodb");

let client;

const connectMongo = async () => {
  const connected = await mongoConnector.connectToServer();
  if (connected === 'connected') {
    client = mongoConnector.getDb();
  }
}

(async() => {
await connectMongo()
app.use(cookieParser());
const clients = new Map();


setInterval(() => {
  clients.forEach((value, key) => {
    senderWS(client, 'skillbox', 'sessions', 'timers', key, value);
  });
}, 1000);

server.on('upgrade', (req, socket, head) => {
  const cookies = cookie.parse(req.headers['cookie']);
  req.sessionId = cookies.sessionId;
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  })
});

wss.on('connection', (ws, req) => {
  wssHandler(ws, req, clients, client);
});

app.use(async (req, res, next) => {
  try {
    req.db = client.db("skillbox");
    next();
  } catch (err) {
    next(err);
  }
});

app.use("/api/timers", require("./api/timers"));
app.use("/", require("./api/authorization"));

nunjucks.configure("views", {
  autoescape: true,
  express: app,
  tags: {
    blockStart: "[%",
    blockEnd: "%]",
    variableStart: "[[",
    variableEnd: "]]",
    commentStart: "[#",
    commentEnd: "#]",
  },
});

app.set("view engine", "njk");

app.use(express.json());
app.use(express.static("public"));

const auth = () => async (req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }

  const user = await findUserBySessionId(req.db, req.cookies["sessionId"]);
  req.user = user;
  req.sessionId = req.cookies["sessionId"];
  next();
};

const findUserBySessionId = async (db, sessionId) => {
  const session = await db.collection("sessions").findOne({ _id: ObjectId(sessionId) });
  if (!session) {
    return;
  }
  return await db.collection("users").findOne({ _id: session.userId });
};

app.get("/", auth(), (req, res) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
  });
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});

})();
