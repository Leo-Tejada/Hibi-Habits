const fs = require('fs');
const file = 'src/components/habits/habit-graph.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<GraphEdges links={graph.links} />',
  '<div data-layer="graph" className="absolute inset-0 origin-center">\n        <GraphEdges links={graph.links} />'
);

content = content.replace(
  ': null}\n    </div>',
  ': null}\n      </div>\n    </div>'
);

fs.writeFileSync(file, content);
