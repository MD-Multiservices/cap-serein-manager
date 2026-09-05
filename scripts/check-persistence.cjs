const fs=require('node:fs'),path=require('node:path');
const violations=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())walk(file);else if(/\.(ts|tsx)$/.test(file)){
 const text=fs.readFileSync(file,'utf8');
 if(/\b(?:localStorage|sessionStorage)\b|(?:@\/lib\/|\.\/|\.\.\/)(?:database|storage)["']/.test(text))violations.push(file);
}}}
for(const dir of ['app','components','lib'])walk(dir);
if(violations.length){console.error('Ancienne persistance détectée :\n'+violations.join('\n'));process.exitCode=1;}
else console.log('PASS: aucune dépendance métier au stockage navigateur ou à la base en mémoire.');
