$(document).ready(function() {
  var socket = io.connect('/');

  $('#correct').click(function() {
    var text = $('input').val();
    socket.emit('spell-check', { word : text });
  });

  socket.on('corrected', function(data) {
    $('#corrected').html(data.correct);
  });
});
