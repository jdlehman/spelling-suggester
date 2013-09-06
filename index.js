// Declare modules to use (Express, handlebars, fast-csv)
var express = require('express'),
    exphbs  = require('express3-handlebars'),
    csv = require('fast-csv'),
    app = express();

var port = 8080

// set up handlebar
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.static(__dirname + '/public'));

// Store word frequency to hash
var wordFreq = importCSV('word_frequency.csv');

// Alphabet and apostrophe for words like don't
var alphabet = "abcdefghijklmnopqrstuvwxyz'";

// render page
app.get('/', function (req, res) {
  res.render('home');
});

var io = require('socket.io').listen(app.listen(port));

// set up socket.io listeners
io.sockets.on('connection', function(socket) {

  // On spell-check event (from client)
  socket.on('spell-check', function(data) {
    // run spell check on word, and send result back to client
    var correctWord = spellCheck(data.word.toLowerCase());
    io.sockets.emit('corrected', { correct : correctWord });

    // Log received word and spell-checked word
    console.log("Received word: " + data.word);
    console.log("Corrected word: " + correctWord);
  });
});

// check word spelling based on
// word frequency data and possible words
// (distance 1 and 2 away)
function spellCheck(word) {
  // check if word is already known
  // (exists in hash)
  if(word in wordFreq) {
    return word;
  }

  // get words edit distance of 1 and 2 away
  var wordsDist1 = wordsEditDistance1([word]);
  var wordsDist2 = wordsEditDistance1(wordsDist1);

  // combine word possibilities
  var allPossibleWords = wordsDist1.concat(wordsDist2);

  // Choose most probable word based on frequenc
  var decision = mostProbableWord(allPossibleWords);

  // Log edit distance 1 and 2 words
  console.log("Edit Distance 1 Words:");
  console.log(wordsDist1);
  console.log("Edit Distance 2 Words:");
  console.log(wordsDist2);

  return decision || "No suggestions";
}

// Generate list of words of 1 edit
// distance away for each word in words
function wordsEditDistance1(words) {

  var possibleWords = [];

  // generate list based on each input word
  words.forEach(function(word) {
    for(var i = 0; i < word.length; i++) {
      //deleted letter
      pushIfInSet(possibleWords, deletedWord(word, i));

      // iterate through alphabet
      for(var j = 0; j < alphabet.length; j++) {
        //changed letter
        pushIfInSet(possibleWords, replacedWord(word, i, j));

        //inserted letter
        pushIfInSet(possibleWords, insertedWord(word, i, j));

        // insertedWord special case
        // insert letter at end of word
        if(i == word.length - 1) {
          var insertedWrd = word + alphabet[j];
          pushIfInSet(possibleWords, insertedWrd);
        }
      }
    }

    // swap letter words
    for(var i = 0; i < word.length; i++) {
      for(var j = i + 1; j < word.length; j++) {
        //swap i with j
        pushIfInSet(possibleWords, swappedWord(word, i, j));
      }
    }
  });

  return possibleWords;
}

// Generate a word with char at index deleted
function deletedWord(word, index) {
  return word.substring(0, index) + word.substring(index + 1);
}

// Generate a word with char at index replaced by
// Alphabet letter at alphIndex
function replacedWord(word, index, alphIndex) {
  return word.substring(0, index) + alphabet[alphIndex] + word.substring(index + 1);
}

// Generate a word with alphabet char at alphIndex
// inserted at index
function insertedWord(word, index, alphIndex) {
  return word.substring(0, index) + alphabet[alphIndex] + word.substring(index);
}

// Generate a word with chars at index and secondIndex swapped
function swappedWord(word, index, secondIndex) {
  return word.substring(0, index) + word[secondIndex]
    + word.substring(index + 1, secondIndex)
    +  word[index] + word.substring(secondIndex + 1);
}

// Add word to set if in word frequnecy hash
function pushIfInSet(wordSet, word) {
  if(word in wordFreq) {
    wordSet.push(word);
  }
}

// choose word based on frequency and occurrences
function mostProbableWord(words) {
  var frequencies = [];
  var wordOccur = {};
  var freqPairs = {};

  words.forEach(function(word) {
    // store word occurences
    wordOccur[word] = (wordOccur[word] || 0) + 1;

    // calculate new frequency based on
    // word frequency and number of word occurrences
    var freq = wordFreq[word] * wordOccur[word];

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

// Import CSV to hash using fast-csv
function importCSV(fileName) {
  var wordFreq = {};

  csv(fileName)
      .on("data", function(data) {
        // add data to hash
        wordFreq[data[0]] = data[1];
       })
      .on("end", function() {
            console.log("Done importing csv");
       })
      .on("error", function(err) {
        // Handle error (because of apostrophes)
        var errStr = err.toString();
        // add parsed error data if only error because
        // of apostrophe, otherwise log error
        if(errStr.indexOf("'") != -1) {
          var data = errStr.split('row')[1].split(',');
          wordFreq[data[0].trim()] = data[1];
        }
        else {
          console.log("CSV Import Error: " + err);
        }
      })
    .parse();

    return wordFreq;
}
