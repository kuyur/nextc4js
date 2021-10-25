/**
 * @author kuyur@kuyur.info
 */

var fs = require('fs');

function printHelp() {
  console.log('Usage:');
  console.log('  --input or -i: specify input file path of source file');
  console.log('  --output or -o: specify output file path of built charmap');
}

var args = process.argv.slice(2);
var input_path, output_path;
for (var i = 0; i < args.length; ++i) {
  if (args[i] === '--input' || args[i] === '-i') {
    input_path = args[i+1];
  } else if (args[i] === '--output' || args[i] === '-o') {
    output_path = args[i+1];
  }
}

if (!input_path || !output_path) {
  printHelp();
  process.exit(1);
}

var input_content;
try {
  input_content = fs.readFileSync(input_path, {
    encoding: 'utf8'
  });
} catch (error) {
  console.log(error.toString());
  process.exit(1);
}

var input_lines = input_content.trim().replace(/\r\n/g, '\n').split('\n');
var input_raw_arr = [];
input_lines.forEach((line, index) => {
  if (!line) {
    return;
  }
  line = line.trim();
  if (line.startsWith('#')) {
    return;
  }

  var parts = line.split(/\s+/);
  input_raw_arr.push({
    codepoint: Number.parseInt(parts[0], 16),
    unicode_codepoint: Number.parseInt(parts[1], 16)
  });
});

var raw_count = input_raw_arr.length;
if (raw_count === 0) {
  console.log('Nothing to generate. Exit.');
  process.exit(0);
}

var start_codepoint = input_raw_arr[0].codepoint,
  end_codepoint = input_raw_arr[raw_count - 1].codepoint;

var count = end_codepoint - start_codepoint + 1;
var output_buffer = new Uint8Array(count * 2);

var offset = 0,
  codepoint_offset = input_raw_arr[0].codepoint;
for (var i = 0; i < raw_count; ++i) {
  var pair = input_raw_arr[i];
  while (codepoint_offset !== pair.codepoint) {
    output_buffer[offset * 2] = 0xFD;
    output_buffer[offset * 2 + 1] = 0xFF;
    offset++;
    codepoint_offset++;
  }

  // low byte
  output_buffer[offset * 2] = pair.unicode_codepoint & 0xFF;
  // high byte
  output_buffer[offset * 2 + 1] = pair.unicode_codepoint >>> 8;
  offset++;
  codepoint_offset++;
}

// remove the file if exists
if (fs.existsSync(output_path)) {
  fs.unlinkSync(output_path);
}

// write GBK buffer (2-bytes characters)
fs.writeFileSync(output_path, output_buffer, 'binary');

console.log('Charmap ' + output_path + ' is generated.');
