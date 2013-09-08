// Declare modules to use (Express, handlebars, fast-csv)
var express = require('express'),
    exphbs  = require('express3-handlebars'),
    csv = require('fast-csv'),
    app = express(),
    SpellChecker = require('./spellchecker');

var port = 8080

// set up handlebar
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.static(__dirname + '/public'));

// Store word frequency to hash
var sc = new SpellChecker(importCSV('word_frequency.csv'));

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
    var correctWord = sc.spellCheck(data.word.toLowerCase());
    io.sockets.emit('corrected', { correct : correctWord });

    // Log received word and spell-checked word
    console.log("Received word: " + data.word);
    console.log("Corrected word: " + correctWord);
  });
});

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

