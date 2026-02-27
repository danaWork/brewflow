const fs = require('fs');

const filePath = process.argv[2];
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const strings = data.strings;

const stringStats = strings
  .map(s => ({ str: s, len: s.length }))
  .sort((a, b) => b.len - a.len)
  .slice(0, 50);

const results = stringStats.map(s => ({
  len: s.len,
  preview: s.str.substring(0, 100).replace(/\n/g, '\\n')
}));

fs.writeFileSync('string_analysis.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Results written to string_analysis.json');
