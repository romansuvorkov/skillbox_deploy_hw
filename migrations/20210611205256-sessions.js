module.exports = {
  async up(db) {
    await db.createCollection("sessions");
  },

  async down(db) {
    await db.collection("sessions").drop();
  },
};
