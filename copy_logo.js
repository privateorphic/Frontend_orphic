import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = __dirname;
const srcFile = path.join(baseDir, 'src', 'components', 'orphicsolution_logo.jpg');
const assetsDir = path.join(baseDir, 'src', 'assets');
const publicDir = path.join(baseDir, 'public');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.copyFileSync(srcFile, path.join(assetsDir, 'orphicsolution_logo.jpg'));
fs.copyFileSync(srcFile, path.join(assetsDir, 'logo.jpg'));
fs.copyFileSync(srcFile, path.join(publicDir, 'logo.jpg'));
fs.copyFileSync(srcFile, path.join(publicDir, 'orphicsolution_logo.jpg'));

console.log('SUCCESS: Copied logo to src/assets and public directories!');
