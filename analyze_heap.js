const fs = require('fs');

const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a heap snapshot file path.');
  process.exit(1);
}

console.log(`Reading heap snapshot: ${filePath}`);
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const meta = data.snapshot.meta;
const nodes = data.nodes;
const strings = data.strings;

const nodeFieldCount = meta.node_fields.length;
const typeIndex = meta.node_fields.indexOf('type');
const nameIndex = meta.node_fields.indexOf('name');
const sizeIndex = meta.node_fields.indexOf('self_size');

const nameStats = new Map();

for (let i = 0; i < nodes.length; i += nodeFieldCount) {
  // const type = nodes[i + typeIndex]; // Can use to filter out certain types if needed
  const nameStringIndex = nodes[i + nameIndex];
  const size = nodes[i + sizeIndex];
  
  const name = strings[nameStringIndex];
  
  if (!nameStats.has(name)) {
    nameStats.set(name, { count: 0, size: 0 });
  }
  const stat = nameStats.get(name);
  stat.count++;
  stat.size += size;
}

const sortedByCount = Array.from(nameStats.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 20);
const sortedBySize = Array.from(nameStats.entries()).sort((a, b) => b[1].size - a[1].size).slice(0, 20);

const results = {
  topByCount: sortedByCount.map(([name, stat]) => ({ name, count: stat.count, size: stat.size })),
  topBySize: sortedBySize.map(([name, stat]) => ({ name, count: stat.count, size: stat.size })),
  applicationNodes: []
};

let detachedCount = 0;
for (const [name, stat] of nameStats.entries()) {
  if (name.toLowerCase().includes('detached')) {
    detachedCount += stat.count;
  }
}
results.detachedCount = detachedCount;

for (const [name, stat] of nameStats.entries()) {
  if (/(order|product|user|cart|item|branch|sluggish|menu)/i.test(name)) {
    results.applicationNodes.push({ name, count: stat.count, size: stat.size });
  }
}

fs.writeFileSync('heap_analysis.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Results written to heap_analysis.json');
