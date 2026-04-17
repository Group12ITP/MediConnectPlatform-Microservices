const mongoose = require('mongoose');

let identityConnection;
let identityConnectionPromise;

const getIdentityUri = () =>
  process.env.SHARED_IDENTITY_MONGODB_URI || process.env.MONGODB_URI;

const getIdentityConnection = () => {
  if (!identityConnection) {
    identityConnection = mongoose.createConnection(getIdentityUri());
  }
  return identityConnection;
};

const connectIdentityDB = async () => {
  if (!identityConnectionPromise) {
    identityConnectionPromise = getIdentityConnection().asPromise();
  }

  const conn = await identityConnectionPromise;
  console.log(`✅ Shared Identity DB Connected: ${conn.host}`);
  return conn;
};

module.exports = {
  connectIdentityDB,
  getIdentityConnection,
};
