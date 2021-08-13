const { ObjectId } = require("mongodb");


const senderWS = async (client, baseName, collectionOne, collectionTwo, id, wsObj) => {
    const session = await client.db(baseName).collection(collectionOne).findOne({ _id: ObjectId(id) });
    const result = await client.db(baseName)
        .collection(collectionTwo)
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
          element.progress = end - element.start;
        }
        element.id = element._id;
        element.end = end;
      });
      wsObj.send(JSON.stringify({type: 'all_timers', timers: result}));
}

module.exports = senderWS;
