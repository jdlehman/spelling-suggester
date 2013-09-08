var assert = require("assert")
var SpellChecker = require("../spellchecker");

describe('SpellChecker', function() {

  var sc = new SpellChecker({ test: 100, best: 50, rest: 200 });
  var word = 'abcd';

  describe('#deletedWord()', function() {
    it('should delete character at index arg1', function() {
      assert.equal('bcd', sc.deletedWord(word, 0));
      assert.equal('acd', sc.deletedWord(word, 1));
      assert.equal('abc', sc.deletedWord(word, 3));
    });
  });

  describe('#replacedWord()', function() {
    it('should replace a character at index arg2 with alphabet at index arg3', function() {
      assert.equal('jbcd', sc.replacedWord(word, 0, 9));
      assert.equal('abed', sc.replacedWord(word, 2, 4));
      assert.equal('abcz', sc.replacedWord(word, 3, 25));
    });
  });

  describe('#insertedWord()', function() {
    it('should insert a character before index arg2 with alphabet at index arg3', function() {
      assert.equal('jabcd', sc.insertedWord(word, 0, 9));
      assert.equal('abecd', sc.insertedWord(word, 2, 4));
      assert.equal('abczd', sc.insertedWord(word, 3, 25));
    });
  });

  describe('#swappedWord()', function() {
    it('should swap a character at index arg2 with character at index arg3', function() {
      assert.equal('cbad', sc.swappedWord(word, 0, 2));
      assert.equal('abdc', sc.swappedWord(word, 2, 3));
      assert.equal('adcb', sc.swappedWord(word, 1, 3));
    });
  });

  describe('#pushIfInSet()', function() {
    it('should add word to set if word is in dictionary', function() {
      var set = [];
      sc.pushIfInSet(set, 'west');
      sc.pushIfInSet(set, 'best');
      sc.pushIfInSet(set, 'rest');
      sc.pushIfInSet(set, '');
      sc.pushIfInSet(set, undefined);

      assert.equal(2, set.length);
      assert.equal(['best', 'rest'][0], set[0]);
      assert.equal(['best', 'rest'][1], set[1]);
    });
  });
});
