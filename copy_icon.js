const fs = require('fs');
const path = require('path');
const source = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\0dd2ff85-575b-49e4-b926-72bbe2243d7e\\biyo_dhowr_icon_1782494616934.png';
const targetDir = path.join(__dirname, 'assets');
const targetFile = path.join(targetDir, 'icon.png');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir);
}
fs.copyFileSync(source, targetFile);
console.log('Sawirkii si sax ah ayaa loogu wareejiyay assets/icon.png!');
