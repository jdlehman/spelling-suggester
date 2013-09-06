$(document).ready(function() {
  var socket = io.connect('/');

  // send text-field to server
  $('#correct').click(function() {
    var text = $('#input').val();
    socket.emit('spell-check', { word : text });
  });

  // clear old suggestion and input
  $('#input').click(function() {
    $(this).val('');
    $('#corrected').html('');
  });

  // Fill in corrected word from server
  socket.on('corrected', function(data) {
    $('#corrected').html(data.correct);
  });
});
