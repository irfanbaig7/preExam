const fs = require('fs/promises');
// import the inner file: the package index runs a debug block when required directly
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

async function extractPdfText(filePath) {
  const buf = await fs.readFile(filePath);
  if (buf.subarray(0, 5).toString() !== '%PDF-') throw new Error('File is not a valid PDF');
  const result = await pdfParse(buf);
  return result.text || '';
}

module.exports = { extractPdfText };
