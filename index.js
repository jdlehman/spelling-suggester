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
var alphabet = 'abcdefghijklmnopqrstuvwxyz';

csv("word_frequency.csv")
    .on("data", function(data) {
      wordFreq[data[0]] = data[1];
     })
    .on("end", function() {
          console.log("Done importing csv");
     })
    .on("error", function(err) {
      //Handle error (because of ')
      var errStr = err.toString();
      if(errStr.indexOf("'") != -1) {
        var data = errStr.split('row')[1].split(',');
        wordFreq[data[0]] = data[1];
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

  var possibleWords = [];

  for(var i = 0; i < word.length; i++) {
    //deleted letter
    possibleWords.push(word.substring(0, i) + word.substring(i + 1));
    for(var j = 0; j < alphabet.length; j++) {
      //changed letter
      var changedWord = word.substring(0, i) + alphabet[j] + word.substring(i + 1);
      possibleWords.push(changedWord);

      //inserted letter
      var insertedWord = word.substring(0, i) + alphabet[j] + word.substring(i);
      possibleWords.push(insertedWord);

      // insertedWord special case
      // insert letter at end of word
      if(i == word.length - 1) {
        insertedWord = word + alphabet[j];
        possibleWords.push(insertedWord);
      }
    }
  }

  // swap letter words
  for(var i = 0; i < word.length; i++) {
    for(var j = i + 1; j < word.length; j++) {
      //swap i with j
      var swappedWord = word.substring(0, i) + word[j] + word.substring(i + 1, j) +  word[i] + word.substring(j + 1);
      possibleWords.push(swappedWord);
    }
  }

  console.log(possibleWords);
  return possibleWords[0];
  /*else {
    return "no";
  }*/
}
