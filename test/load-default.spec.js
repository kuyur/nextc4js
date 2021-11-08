const { loadDefault } = require('../lib/load-default');

describe('Loading Default Context unit test', function() {
  it('loadDefault()', function() {
    var context = loadDefault();
    expect(context).not.toBe(null);
    var context2 = loadDefault();
    expect(context2).toBe(context);
  });
});
