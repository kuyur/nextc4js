/**
 * @author kuyur@kuyur.info
 */

var fs = require('fs');

function printHelp() {
  console.log('Usage:');
  console.log('  --input1 or -i1: specify input file path of charmap 1');
  console.log('  --input2 or -i2: specify input file path of charmap 2');
  console.log('  --output or -o: specify output file path of built charmap');
}

var args = process.argv.slice(2);
var input_path1, input_path2, output_path;
for (var i = 0; i < args.length; ++i) {
  if (args[i] === '--input1' || args[i] === '-i1') {
    input_path1 = args[i+1];
  } else if (args[i] === '--input2' || args[i] === '-i2') {
    input_path2 = args[i+1];
  } else if (args[i] === '--output' || args[i] === '-o') {
    output_path = args[i+1];
  }
}

if (!input_path1 || !input_path2 || !output_path) {
  printHelp();
  process.exit(1);
}

var input1_buffer;
try {
  input1_buffer = fs.readFileSync(input_path1);
} catch (error) {
  console.log(error.toString());
  process.exit(1);
}

var input2_buffer;
try {
  input2_buffer = fs.readFileSync(input_path2);
} catch (error) {
  console.log(error.toString());
  process.exit(1);
}

// remove the file if exists
if (fs.existsSync(output_path)) {
  fs.unlinkSync(output_path);
}
 
// write the first part
fs.writeFileSync(output_path, input1_buffer, 'binary')

// write the second part
fs.appendFileSync(output_path, input2_buffer, 'binary');

console.log('Charmap ' + output_path + ' is generated.');