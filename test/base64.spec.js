const base64 = require('../lib/base64');

describe('Base64 unit test', function() {
  it('encode() - string', function() {
    var input = 'Man is distinguished, not only by his reason, but by this singular passion from other animals, ' +
      'which is a lust of the mind, that by a perseverance of delight in the continued and indefatigable generation ' +
      'of knowledge, exceeds the short vehemence of any carnal pleasure.';
    var buffer = new Uint8Array(input.length);
    for (var i = 0; i < input.length; ++i) {
      buffer[i] = input.charCodeAt(i);
    }
    expect(base64.encode(buffer)).toBe('TWFuIGlzIGRpc3Rpbmd1aXNoZWQsIG5vdCBvbmx5IGJ5IGhpcyByZWFzb24sIGJ1dCBieSB0aGlz' +
      'IHNpbmd1bGFyIHBhc3Npb24gZnJvbSBvdGhlciBhbmltYWxzLCB3aGljaCBpcyBhIGx1c3Qgb2Yg' +
      'dGhlIG1pbmQsIHRoYXQgYnkgYSBwZXJzZXZlcmFuY2Ugb2YgZGVsaWdodCBpbiB0aGUgY29udGlu' +
      'dWVkIGFuZCBpbmRlZmF0aWdhYmxlIGdlbmVyYXRpb24gb2Yga25vd2xlZGdlLCBleGNlZWRzIHRo' +
      'ZSBzaG9ydCB2ZWhlbWVuY2Ugb2YgYW55IGNhcm5hbCBwbGVhc3VyZS4=');

    expect(base64.encode(new Uint8Array(['a'.charCodeAt(0)]))).toBe('YQ==');
    expect(base64.encode(new Uint8Array(['a'.charCodeAt(0), 'b'.charCodeAt(0)]))).toBe('YWI=');
  });

  it('encode() - random bytes', function() {
    var length = 10000;
    var buffer = new Uint8Array(length);
    for (var i = 0; i < length; ++i) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    var encoded = base64.encode(buffer);
    expect(encoded.length).toBe((length - length % 3) / 3 * 4 + ((length % 3) === 0 ? 0 : 4));
    var decoded = base64.decode(encoded);
    expect(decoded.length).toBe(length);
    expect(decoded).toEqual(buffer);
  });

  it('decode() - string', function() {
    var input = 'TWFuIGlzIGRpc3Rpbmd1aXNoZWQsIG5vdCBvbmx5IGJ5IGhpcyByZWFzb24sIGJ1dCBieSB0aGlz' +
      'IHNpbmd1bGFyIHBhc3Npb24gZnJvbSBvdGhlciBhbmltYWxzLCB3aGljaCBpcyBhIGx1c3Qgb2Yg' +
      'dGhlIG1pbmQsIHRoYXQgYnkgYSBwZXJzZXZlcmFuY2Ugb2YgZGVsaWdodCBpbiB0aGUgY29udGlu' +
      'dWVkIGFuZCBpbmRlZmF0aWdhYmxlIGdlbmVyYXRpb24gb2Yga25vd2xlZGdlLCBleGNlZWRzIHRo' +
      'ZSBzaG9ydCB2ZWhlbWVuY2Ugb2YgYW55IGNhcm5hbCBwbGVhc3VyZS4=';
    var output = base64.decode(input);

    var origin = 'Man is distinguished, not only by his reason, but by this singular passion from other animals, ' +
      'which is a lust of the mind, that by a perseverance of delight in the continued and indefatigable generation ' +
      'of knowledge, exceeds the short vehemence of any carnal pleasure.';
    var buffer = new Uint8Array(origin.length);
    for (var i = 0; i < origin.length; ++i) {
      buffer[i] = origin.charCodeAt(i);
    }

    expect(output.length).toBe(buffer.length);
    expect(output).toEqual(buffer);

    var input2 = 'TWFuIGlzIGRpc3Rpbmd1aXNoZWQsIG5vdCBvbmx5IGJ5IGhpcyByZWFzb24sIGJ1dCBieSB0aGlz' +
      'IHNpbmd1bGFyIHBhc3Npb24gZnJvbSBvdGhlciBhbmltYWxzLCB3aGljaCBpcyBhIGx1c3Qgb2Yg' +
      'dGhlIG1pbmQsIHRoYXQgYnkgYSBwZXJzZXZlcmFuY2Ugb2YgZGVsaWdodCBpbiB0aGUgY29udGlu' +
      'dWVkIGFuZCBpbmRlZmF0aWdhYmxlIGdlbmVyYXRpb24gb2Yga25vd2xlZGdlLCBleGNlZWRzIHRo' +
      'ZSBzaG9ydCB2ZWhlbWVuY2Ugb2YgYW55IGNhcm5hbCBwbGVhc3VyZS4';
    var output2 = base64.decode(input2);
    expect(output2).toEqual(output);
  });

  it('encode() - null', function() {
    expect(base64.encode(null)).toBe('');
    expect(base64.encode(new Uint8Array(0))).toBe('');
  });

  it('decode() - null', function() {
    expect(base64.decode(null)).toEqual(new Uint8Array(0));
    expect(base64.decode({})).toEqual(new Uint8Array(0));
  });

  it('decode() - invalid', function() {
    expect(() => base64.decode('a')).toThrow('Invalid base64 string.');
    expect(() => base64.decode('&^%=')).toThrow('Invalid base64 string.');

    // atob('YR==') will output a normal result.
    // comparing to atob(), the implementation here is checking more strictly.
    expect(() => base64.decode('YR==')).toThrow('Invalid base64 string.');
    expect(() => base64.decode('YWL=')).toThrow('Invalid base64 string.');

    expect(() => base64.decode('ABC*')).toThrow('Invalid base64 string.');
    expect(() => base64.decode('*WI=')).toThrow('Invalid base64 string.');
    expect(() => base64.decode('*Q')).toThrow('Invalid base64 string.');
  });
});