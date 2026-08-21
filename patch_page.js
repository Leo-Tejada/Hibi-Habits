const fs = require('fs');
let file = 'src/app/habits/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<div className="flex h-dvh flex-col overflow-hidden">',
  '<div className="relative h-dvh w-full overflow-hidden">'
);
content = content.replace(
  '<TopBar today={view.today} nav={seasonNavFor(undefined, view.today)} current="/habits" />',
  '<div className="absolute inset-x-0 top-0 z-20">\n        <TopBar today={view.today} nav={seasonNavFor(undefined, view.today)} current="/habits" />\n      </div>'
);
content = content.replace(
  '<main className="relative flex-1">',
  '<main className="absolute inset-0">'
);

fs.writeFileSync(file, content);
