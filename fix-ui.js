// Script to fix the UI.js file
const fs = require('fs');
const path = require('path');

// Read the UI.js file
const uiJsPath = path.join(__dirname, 'src', 'UI.js');
let uiJsContent = fs.readFileSync(uiJsPath, 'utf8');

// Define regex patterns to find map-related methods
const patterns = [
  /[ ]+_drawSectorMap\([\s\S]*?(?=[ ]+_handleMapMouseMove\(|[ ]+\w+\()/g,
  /[ ]+_handleMapMouseMove\([\s\S]*?(?=[ ]+_handleMapClick\(|[ ]+\w+\()/g,
  /[ ]+_handleMapClick\([\s\S]*?(?=[ ]+setOnMapSelect\(|[ ]+\w+\()/g
];

// Replace each pattern with an empty string
patterns.forEach(pattern => {
  uiJsContent = uiJsContent.replace(pattern, '');
});

// Write the fixed content back to the file
fs.writeFileSync(uiJsPath, uiJsContent, 'utf8');

console.log('UI.js file has been fixed!');