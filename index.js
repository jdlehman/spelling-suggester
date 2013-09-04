//set up express and handlebars
var express = require('express'),
    exphbs  = require('express3-handlebars'),
    app = express();

var port = 8080

//use handlebars
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var csv = require("fast-csv");

var wordFreq = {};

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

//render page
app.get('/', function (req, res) {
  res.render('home', { wordFreq: wordFreq });
});

app.listen(port);
