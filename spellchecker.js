function SpellChecker(dict) {
  this.dict = dict;
  this.alph = "abcdefghijklmnopqrstuvwxyz'";
  this.type = 'spelling thing';
}

// check word spelling based on
// word frequency data and possible words
// (distance 1 and 2 away)
SpellChecker.prototype.spellCheck = function(word) {
  // check if word is already known
  // (exists in hash)
  if(word in this.dict) {
    return word;
  }

  // get words edit distance of 1 and 2 away
  var wordsDist1 = this.wordsEditDistance1([word]);
  var wordsDist2 = this.wordsEditDistance1(wordsDist1);

  // combine word possibilities
  var allPossibleWords = wordsDist1.concat(wordsDist2);

  // Choose most probable word based on frequenc
  var decision = this.mostProbableWord(allPossibleWords);

  // Log edit distance 1 and 2 words
  console.log("Edit Distance 1 Words:");
  console.log(wordsDist1);
  console.log("Edit Distance 2 Words:");
  console.log(wordsDist2);

  return decision || "No suggestions";
}

// Generate list of words of 1 edit
// distance away for each word in words
SpellChecker.prototype.wordsEditDistance1 = function(words) {
  var that = this;
  var possibleWords = [];

  // generate list based on each input word
  words.forEach(function(word) {
    for(var i = 0; i < word.length; i++) {
      //deleted letter
      that.pushIfInSet(possibleWords, that.deletedWord(word, i));

      // iterate through alphabet
      for(var j = 0; j < that.alph.length; j++) {
        //changed letter
        that.pushIfInSet(possibleWords, that.replacedWord(word, i, j));

        //inserted letter
        that.pushIfInSet(possibleWords, that.insertedWord(word, i, j));

        // insertedWord special case
        // insert letter at end of word
        if(i == word.length - 1) {
          var insertedWrd = word + that.alph[j];
          that.pushIfInSet(possibleWords, insertedWrd);
        }
      }
    }

    // swap letter words
    for(var i = 0; i < word.length; i++) {
      for(var j = i + 1; j < word.length; j++) {
        //swap i with j
        that.pushIfInSet(possibleWords, that.swappedWord(word, i, j));
      }
    }
  });

  return possibleWords;
}

// Generate a word with char at index deleted
SpellChecker.prototype.deletedWord = function(word, index) {
  return word.substring(0, index) + word.substring(index + 1);
}

// Generate a word with char at index replaced by
// Alphabet letter at alphIndex
SpellChecker.prototype.replacedWord = function(word, index, alphIndex) {
  return word.substring(0, index) + this.alph[alphIndex] + word.substring(index + 1);
}

// Generate a word with alphabet char at alphIndex
// inserted at index
SpellChecker.prototype.insertedWord = function(word, index, alphIndex) {
  return word.substring(0, index) + this.alph[alphIndex] + word.substring(index);
}

// Generate a word with chars at index and secondIndex swapped
SpellChecker.prototype.swappedWord = function(word, index, secondIndex) {
  return word.substring(0, index) + word[secondIndex]
    + word.substring(index + 1, secondIndex)
    +  word[index] + word.substring(secondIndex + 1);
}

// Add word to set if in word frequnecy hash
SpellChecker.prototype.pushIfInSet = function(wordSet, word) {
  if(word in this.dict) {
    wordSet.push(word);
  }
}

// choose word based on frequency and occurrences
SpellChecker.prototype.mostProbableWord = function(words) {
  var frequencies = [];
  var wordOccur = {};
  var freqPairs = {};
  var that = this;

  words.forEach(function(word) {
    // store word occurences
    wordOccur[word] = (wordOccur[word] || 0) + 1;

    // calculate new frequency based on
    // word frequency and number of word occurrences
    var freq = that.dict[word] * wordOccur[word];

    // store to frequency array and
    // pair with word in freqPair hash
    frequencies.push(freq);
    freqPairs[freq] = word;
  });

  // get max frequency in array of frequencies
  var maxFreq = Math.max.apply(Math, frequencies);

  // return name of word paired with max frequency
  return freqPairs[maxFreq];
}

module.exports = SpellChecker;
