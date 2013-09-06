// set up express and handlebars
var express = require('express'),
    exphbs  = require('express3-handlebars'),
    app = express();

var port = 8080

// use handlebars
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.static(__dirname + '/public'));

var csv = require("fast-csv");

var wordFreq = {};
// Alphabet and apostrophe for words like don't
var alphabet = "abcdefghijklmnopqrstuvwxyz'";

csv("word_frequency.csv")
    .on("data", function(data) {
      wordFreq[data[0]] = data[1];
     })
    .on("end", function() {
          console.log("Done importing csv");
     })
    .on("error", function(err) {
      // Handle error (because of ')
      var errStr = err.toString();
      if(errStr.indexOf("'") != -1) {
        var data = errStr.split('row')[1].split(',');
        wordFreq[data[0].trim()] = data[1];
      }
    })
    .parse();

// render page
app.get('/', function (req, res) {
  res.render('home');
});

var io = require('socket.io').listen(app.listen(port));

// set up socket.io listeners
io.sockets.on('connection', function(socket) {
  socket.on('spell-check', function(data) {
    console.log("Received word: " + data.word);
    var correctWord = spellCheck(data.word.toLowerCase());
    console.log("Corrected word: " + correctWord);
    io.sockets.emit('corrected', { correct : correctWord });
  });
});

// check word spelling based on 
// word frequency data
function spellCheck(word) {
  //check if word exists
  if(word in wordFreq) {
    return word;
  }

  // get words edit distance of 1 away
  var wordsDist1 = wordsEditDistance1([word]);
  var wordsDist2 = wordsEditDistance1(wordsDist1);

  // combine word possibilities
  var allPossibleWords = wordsDist1.concat(wordsDist2);

  //figure out most probable based on frequency
  var decision = mostProbableWord(allPossibleWords);

  console.log("Dist1:");
  console.log(wordsDist1);
  console.log("Dist2:");
  console.log(wordsDist2);
  return decision || "No suggestions";
}

function wordsEditDistance1(words) {

  var possibleWords = [];

  // generate list based on each input word
  words.forEach(function(word) {
    for(var i = 0; i < word.length; i++) {
      //deleted letter
      var deletedWord = word.substring(0, i) + word.substring(i + 1);
      pushIfInSet(possibleWords, deletedWord);

      // iterate through alphabet
      for(var j = 0; j < alphabet.length; j++) {
        //changed letter
        var replacedWord = word.substring(0, i) + alphabet[j] + word.substring(i + 1);
        pushIfInSet(possibleWords, replacedWord);

        //inserted letter
        var insertedWord = word.substring(0, i) + alphabet[j] + word.substring(i);
        pushIfInSet(possibleWords, insertedWord);

        // insertedWord special case
        // insert letter at end of word
        if(i == word.length - 1) {
          insertedWord = word + alphabet[j];
          pushIfInSet(possibleWords, insertedWord);
        }
      }
    }

    // swap letter words
    for(var i = 0; i < word.length; i++) {
      for(var j = i + 1; j < word.length; j++) {
        //swap i with j
        var swappedWord = word.substring(0, i) + word[j] + word.substring(i + 1, j) +  word[i] + word.substring(j + 1);
        pushIfInSet(possibleWords, swappedWord);
      }
    }
  });

  return possibleWords;

}

function pushIfInSet(array, word) {
  if(word in wordFreq) {
    array.push(word);
  }
}

// choose word based on frequency
// and occurrences 
function mostProbableWord(words) {
  var frequencies = [];
  var freqPairs = {};
  var wordOccur = {};

  words.forEach(function(word) {
    // store word occurences
    wordOccur[word] = (wordOccur[word] || 0) + 1;
  });

  words.forEach(function(word) {
    var freq = wordFreq[word] * wordOccur[word];
    frequencies.push(freq);
    freqPairs[freq] = word;
  });

  var maxFreq = Math.max.apply(Math, frequencies);
  console.log(wordOccur);
  return freqPairs[maxFreq];
}
