const express = require("express");
const bodyParser = require("body-parser");
const { ObjectId } = require("mongodb");
const router = express.Router();

router.get("/", async (req, res) => {
  const isActive = req.query.isActive === "true" ? true : false;
  const session = await req.db.collection("sessions").findOne({ _id: ObjectId(req.cookies["sessionId"]) });
  const result = await req.db
    .collection("timers")
    .find({
      userId: session.userId,
      is_active: isActive,
    })
    .toArray();
  result.forEach((element) => {
    element.id = element._id;
    const start = parseInt(element.start, 10);
    const end = parseInt(element.end, 10);
    element.start = start;
    element.end = end;
  });
  res.json(result);
});

router.post("/:id/stop", async (req, res) => {
  // console.log("req.params.id");
  // console.log(req.params.id);
  const targetTimer = await req.db.collection("timers").findOne({ _id: ObjectId(req.params.id) });
  const now = Date.now();
  await req.db.collection("timers").findOneAndUpdate(
    { _id: ObjectId(req.params.id) },
    {
      $set: {
        end: now,
        duration: now - targetTimer.start,
        is_active: false,
      },
    }
  );
  return res.json(targetTimer._id);
});

router.post("/", bodyParser.json(), async (req, res) => {
  const { description } = req.body;
  // console.log('req.cookies["sessionId"]');
  // console.log(req.cookies["sessionId"]);
  const user = await req.db.collection("sessions").findOne({
    _id: ObjectId(req.cookies["sessionId"]),
  });
  const now = Date.now();
  const timer = await req.db.collection("timers").insertOne({
    start: now,
    description: description,
    duration: 2000,
    is_active: true,
    userId: user.userId,
  });
  return res.status(201).json({ id: timer.insertedId });
});



module.exports = router;
