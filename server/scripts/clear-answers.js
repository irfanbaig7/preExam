require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const env = require('../src/config/env');
const Question = require('../src/models/Question');

mongoose.connect(env.MONGO_URI).then(async () => {
    const r = await Question.updateMany({}, { $unset: { aiAnswer: 1, aiAnswerAt: 1 } });
    console.log('cleared saved answers:', r.modifiedCount);
    await mongoose.disconnect();
});