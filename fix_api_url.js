const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend/src');

function findAndReplace(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findAndReplace(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // If the file is config.js, skip
      if (file === 'config.js') continue;

      let changed = false;

      // Replace const API_BASE_URL = '...' or const API = '...'
      const regex1 = /const\s+(API_BASE_URL|API)\s*=\s*['"`]https:\/\/margarakshak-backend\.onrender\.com['"`];?/g;
      if (regex1.test(content)) {
        content = content.replace(regex1, "import { API_BASE_URL } from '../config';\nconst API = API_BASE_URL;\n// Replaced by automated script");
        changed = true;
      }

      // Replace inline fetch strings
      const regex2 = /['"`]https:\/\/margarakshak-backend\.onrender\.com\/(.*?)['"`]/g;
      if (regex2.test(content)) {
        content = content.replace(regex2, (match, p1) => {
          // If it was a template literal, we just do `${API_BASE_URL}/...`
          // We need to import API_BASE_URL if not already imported
          if (!content.includes('API_BASE_URL')) {
            content = `import { API_BASE_URL } from '../config';\n` + content;
          }
          return `\`\${API_BASE_URL}/${p1}\``;
        });
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

findAndReplace(dir);
