const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

const srcDir = path.join(__dirname, 'frontend');
const destDir = path.join(__dirname, 'public_frontend');

if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
}

copyDir(srcDir, destDir);
console.log('Build concluído: frontend copiado para public_frontend/');
