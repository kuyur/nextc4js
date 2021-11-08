'use strict';

const BufferUtils = require('./lib/buffer-utils');
const { Channel } = require('./lib/channel');
const { CharmapType } = require('./lib/charmap');
const { Condition } = require('./lib/condition');
const Consts = require('./lib/consts');
const { Converter }= require('./lib/converter');
const decoder = require('./lib/decoder');
const encoder = require('./lib/encoder');
const { Reference } = require('./lib/segment');
const { Context } = require('./lib/context');
const base64 = require('./lib/base64');
const { loadFromJson, loadFromJsonSync } =  require('./lib/load-from-json');
const { loadDefault } = require('./lib/load-default');

module.exports = {
  Converter: Converter,
  DecoderMultibyte: decoder.Multibyte,
  DECODER_UTF8: decoder.UTF8,
  DECODER_UTF16LE: decoder.UTF16LE,
  DECODER_UTF16BE: decoder.UTF16BE,
  EncoderMultibyte: encoder.Multibyte,
  ENCODER_UTF8: encoder.UTF8,
  ENCODER_UTF16LE: encoder.UTF16LE,
  ENCODER_UTF16BE: encoder.UTF16BE,
  Channel: Channel,
  Condition: Condition,
  CharmapType: CharmapType,
  SegmentReference: Reference,
  Context: Context,
  Consts: Consts,
  utils: BufferUtils,
  base64: base64,
  loadFromJson: loadFromJson,
  loadFromJsonSync: loadFromJsonSync,
  loadDefault: loadDefault
};
