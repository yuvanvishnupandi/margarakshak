const fs = require('fs');

function fixFile(path) {
    if (!fs.existsSync(path)) return;
    let code = fs.readFileSync(path, 'utf8');
    
    // Replace Tailwind classes with inline styles for colors and backgrounds
    // This is more reliable for dark mode when Tailwind might be conflicting
    code = code.replace(/className=\"(.*?)\"/g, (match, className) => {
        let newClasses = className;
        let styles = [];

        // Backgrounds
        if (newClasses.includes('bg-white')) {
            styles.push("background: 'var(--bg-card)'");
            newClasses = newClasses.replace('bg-white', '');
        }
        if (newClasses.includes('bg-gray-50') || newClasses.includes('bg-gray-100')) {
            styles.push("background: 'var(--bg-secondary)'");
            newClasses = newClasses.replace('bg-gray-50', '').replace('bg-gray-100', '');
        }

        // Text Colors
        if (newClasses.includes('text-gray-900') || newClasses.includes('text-gray-800')) {
            styles.push("color: 'var(--text-primary)'");
            newClasses = newClasses.replace('text-gray-900', '').replace('text-gray-800', '');
        }
        if (newClasses.includes('text-gray-700') || newClasses.includes('text-gray-600') || newClasses.includes('text-gray-500')) {
            styles.push("color: 'var(--text-secondary)'");
            newClasses = newClasses.replace('text-gray-700', '').replace('text-gray-600', '').replace('text-gray-500', '');
        }

        // Borders
        if (newClasses.includes('border-gray-200') || newClasses.includes('border-gray-100')) {
            styles.push("borderColor: 'var(--border)'");
            newClasses = newClasses.replace('border-gray-200', '').replace('border-gray-100', '');
        }

        if (styles.length > 0) {
            // Check if there is already a style prop
            return `style={{ ${styles.join(', ')} }} className=\"${newClasses.trim()}\"`;
        }
        return match;
    });

    // Fix explicit hex colors for dark mode
    code = code.replace(/color:\s*['\"]#0f172a['\"]/g, "color: 'var(--text-primary)'");
    code = code.replace(/color:\s*['\"]#1f2937['\"]/g, "color: 'var(--text-primary)'");
    code = code.replace(/color:\s*['\"]#374151['\"]/g, "color: 'var(--text-secondary)'");
    code = code.replace(/color:\s*['\"]#4b5563['\"]/g, "color: 'var(--text-secondary)'");
    code = code.replace(/color:\s*['\"]#6b7280['\"]/g, "color: 'var(--text-secondary)'");
    code = code.replace(/background:\s*['\"]#fff['\"]/g, "background: 'var(--bg-card)'");
    code = code.replace(/background:\s*['\"]#ffffff['\"]/g, "background: 'var(--bg-card)'");
    code = code.replace(/background:\s*['\"]#f8fafc['\"]/g, "background: 'var(--bg-primary)'");

    fs.writeFileSync(path, code);
}

const filesToFix = [
    './frontend/src/pages/Profile.jsx',
    './frontend/src/pages/RewardsRedeem.jsx',
    './frontend/src/pages/CitizenDashboard.jsx',
    './frontend/src/pages/PoliceCommand.jsx',
    './frontend/src/pages/SubmitReport.jsx',
    './frontend/src/pages/ReviewReports.jsx',
    './frontend/src/pages/ReviewAppeals.jsx',
    './frontend/src/pages/Rules.jsx',
    './frontend/src/pages/MyChallans.jsx'
];

filesToFix.forEach(fixFile);
