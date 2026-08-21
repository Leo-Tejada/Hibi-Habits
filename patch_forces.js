const fs = require('fs');
const file = 'src/lib/graph/forces.ts';
let content = fs.readFileSync(file, 'utf8');

// replace containBodies body
content = content.replace(
  /export function containBodies\([\s\S]*?\}\n\}/,
  "export function containBodies(bodies: Body[], halfWidth: number, halfHeight: number): void {\n  // Disabled to allow the graph to expand beyond the window.\n}"
);

fs.writeFileSync(file, content);
