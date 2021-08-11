const { ObjectId } = require("mongodb");

const wssHandler = async (ws, req, clients, client) => {
  const userId = req.sessionId;
  clients.set(userId, ws);
  ws.on('close', () => {
    clients.delete(userId);
  })
  ws.on('message', async (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      return;
    }
    if (data.type === 'all_timers') {
      const session = await client.db('skillbox').collection("sessions").findOne({ _id: ObjectId(req.sessionId) });
      const result = await client.db('skillbox')
        .collection("timers")
        .find({
          userId: session.userId,
        })
        .toArray();
      result.forEach((element) => {
        let end;
        const start = parseInt(element.start, 10);
        element.start = start;
        if (element.end) {
          end = parseInt(element.end, 10);
        } else {
          const now = Date.now();
          end = parseInt(now, 10);
          element.duration = end - element.start;
        }
        element.id = element._id;
        element.end = end;
      });
      clients.get(req.sessionId).send(JSON.stringify({type: 'all_timers', timers: result}));
    }
  })
};

module.exports = wssHandler;
