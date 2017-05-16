//functions for general use

//this function returns the value associated with 'whichParam' on the URL
function GetURLParameters(whichParams)
{
	var pageURL = window.location.search.substring(1);
	var pageURLVariables = pageURL.split('&');
	for(var i = 0; i < pageURLVariables.length; i++)
	{
		var parameterName = pageURLVariables[i].split('=');
		if(parameterName[0] == whichParams)
		{
			return parameterName[1];
		}
	}
}

var username = GetURLParameters('username');
console.log(3);
console.log(username);
if(username == undefined || username == "")
{
	username = 'Anonymous_'+Math.random();
}

/*
if('undefined' == typeof username || !username)
{
	username = 'Anonymous_'+Math.random();
}
*/
$('#messages').append('<h4>' + username + '</h4>');

var chat_room = 'One Room';


//connect to the socket server

var socket = io.connect();

socket.on('log', function(array)
{
	console.log.apply(console, array);
});

socket.on('join_room_response', function(payload){
	if(payload.result == 'fail')
	{
		alert(payload.message);
		return;
	}
	$('#messages').append('<p>New user joined the room: ' + payload.username + '</p>');
});

socket.on('send_message_response', function(payload){
	if(payload.result == 'fail')
	{
		alert(payload.message);
		return;
	}
	$('#messages').append('<p><b>' + payload.username + ' says:</b> ' + payload.message + '</p>');
});


function send_message()
{
	var payload = {};
	payload.room = chat_room;
	payload.username = username;
	payload.message = $('#send_message_holder').val();
	console.log('*** Client Log Message: \'send_message\' payload: ' + JSON.stringify(payload));
	socket.emit('send_message', payload);
}

$(function(){
	var payload = {};
	payload.room = chat_room;
	payload.username = username;

	console.log('***Client Log Message: \'join_room\' payload: ' + JSON.stringify(payload));
	socket.emit('join_room', payload);
});