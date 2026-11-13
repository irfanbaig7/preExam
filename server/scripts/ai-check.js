const { callLLM } = require('../src/services/ai');

callLLM('Reply with JSON only.', 'Return {"ok":true}', 50).then((out) => {
    console.log('RESULT:', out);
    process.exit(0);
});