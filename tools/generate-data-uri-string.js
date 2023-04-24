/**
 * @author kuyur@kuyur.net
 */

const fs = require('fs');
const base64 = require('../lib/base64');

function printHelp() {
  console.log('Usage:');
  console.log('  --input or -i: specify input file path of source file');
  console.log('  --type or -t: specify the application type. default value: application/octet-stream');
}

var args = process.argv.slice(2);
var input_path,
  application_type = 'application/octet-stream';
for (var i = 0; i < args.length; ++i) {
  if (args[i] === '--input' || args[i] === '-i') {
    input_path = args[i+1];
  } else if (args[i] === '--type' || args[i] === '-t') {
    if (args[i+1]) {
      application_type = args[i+1];
    }
  }
}

if (!input_path) {
  printHelp();
  process.exit(1);
}

var input_content;
try {
  input_content = fs.readFileSync(input_path);
} catch (error) {
  console.log(error.toString());
  process.exit(1);
}

console.log('data:' + application_type + ';base64,' + base64.encode(input_content));
