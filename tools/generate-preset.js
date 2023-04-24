/**
 * @author kuyur@kuyur.net
 */

const fs = require('fs');
const goog = require('../lib/goog-base');
const base64 = require('../lib/base64');
const consts = require('../lib/consts');

function printHelp() {
  console.log('Usage:');
  console.log('  --input or -i: specify input file path of preset template');
  console.log('  --output or -o: specify output file path of built preset');
  console.log('  --template-path: specify the path of charmap template folder if the tool is not running ' +
    'under root folder. Default value is ./presets-template/charmap.');
  console.log('  --embed-charmap: the flag to specify embedding the charmap binary into built preset.');
}

var args = process.argv.slice(2);
var input_path,
  output_path,
  flag_embed_charmap = false,
  template_path = './presets-template/charmap';
for (var i = 0; i < args.length; ++i) {
  if (args[i] === '--input' || args[i] === '-i') {
    input_path = args[i+1];
  } else if (args[i] === '--output' || args[i] === '-o') {
    output_path = args[i+1];
  } else if (args[i] === '--template-path') {
    template_path = args[i+1];
  } else if (args[i] === '--embed-charmap') {
    flag_embed_charmap = true;
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

var configs = JSON.parse(input_content);

var loadCharmapDetail = function(charmapName, type) {
  var path = `${template_path}/${type}/${charmapName.toLowerCase()}.json`;
  try {
    var charmap_content = fs.readFileSync(path, {
      encoding: 'utf8'
    });
    var charmap = JSON.parse(charmap_content);
    if (flag_embed_charmap) {
      // load charmap binary
      if (goog.isString(charmap.buffer) && !charmap.buffer.startsWith(consts.EMBEDDED_BASE64_PREFIX)) {
        // use as file path
        var binary = fs.readFileSync(charmap.buffer);
        charmap.buffer = consts.EMBEDDED_BASE64_PREFIX + base64.encode(binary);
      }
    }
    return charmap;
  } catch (error) {
    console.log(error.toString());
    process.exit(1);
  }
};

// loop decoders
if (goog.isArray(configs.decoders)) {
  configs.decoders = configs.decoders.map(charmapName => loadCharmapDetail(charmapName, 'decoder'));
}

// loop encoders
if (goog.isArray(configs.encoders)) {
  configs.encoders = configs.encoders.map(charmapName => loadCharmapDetail(charmapName, 'encoder'));
}

// loop converters
if (goog.isArray(configs.converters)) {
  configs.converters = configs.converters.map(charmapName => loadCharmapDetail(charmapName, 'converter'));
}

// remove the file if exists
if (fs.existsSync(output_path)) {
  fs.unlinkSync(output_path);
}

// write to file
fs.writeFileSync(output_path, JSON.stringify(configs, null, 2), 'utf-8');

console.log('Preset ' + output_path + ' is generated.');
