const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const router = express.Router();
const { ObjectId } = require("mongodb");
// const { wss } = require('../index');

const findUserByUsername = async (db, username) => await db.collection("users").findOne({ username: username });

const createSession = async (db, userId) => {
  const newSession = await db.collection("sessions").insertOne({
    userId: userId,
  });

  return newSession.insertedId.toString();
};

const deleteSession = async (db, sessionId) => {
  await db.collection("sessions").deleteOne({ _id: ObjectId(sessionId) });
};

router.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
  const user = await req.db.collection("users").insertOne({
    username: username,
    password: hashedPassword,
  });
  const sessionId = await createSession(req.db, user.insertedId);
  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

router.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByUsername(req.db, username);
  const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
  if (!user || user.password !== hashedPassword) {
    return res.redirect("/?authError=true");
  }
  const sessionId = await createSession(req.db, user._id);
  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

router.get("/logout", async (req, res) => {
  await deleteSession(req.db, req.cookies["sessionId"]);
  res.clearCookie("sessionId");
  return res.redirect("/");
});

// wss.on('connection', (ws, req) => {
//   ws.send('Test message');
// })

module.exports = router;
