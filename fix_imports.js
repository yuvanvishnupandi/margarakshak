const fs = require('fs');
const path = require('path');

function fixImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      if (file === 'config.js') continue;
      
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('API_BASE_URL') && !content.includes("import { API_BASE_URL }")) {
        // Find relative path to config.js
        // If in src/components/auth, relative is ../../config
        // If in src/pages, relative is ../config
        let relativePath = path.relative(path.dirname(fullPath), path.join(__dirname, 'frontend/src/config')).replace(/\\/g, '/');
        
        if (!relativePath.startsWith('.')) {
          relativePath = './' + relativePath;
        }

        content = `import { API_BASE_URL } from '${relativePath}';\n` + content;
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed import in ${fullPath}`);
      }
    }
  }
}

fixImports(path.join(__dirname, 'frontend/src'));
