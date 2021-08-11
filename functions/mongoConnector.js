const MongoClient = require( 'mongodb' ).MongoClient;


let _db;

module.exports = {

  connectToServer: async () => {
    try {
      _db = await MongoClient.connect( process.env.DB_URI, {
        useUnifiedTopology: true,
        poolSize: 10,
      })
      return 'connected';
    } catch (err) {
      return err;
    }

  },

  getDb: () => {
    return _db;
  }
};
