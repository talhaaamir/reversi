//functions for general use
var num = 4;
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
//console.log(3);
//console.log(username);
/*
if(username == undefined || username == "")
{
	username = 'Anonymous_'+Math.random();
}
*/

if('undefined' == typeof username || !username)
{
	username = 'Anonymous_'+Math.random();
}

$('#messages').append('<h4>' + username + '</h4>');

var chat_room = GetURLParameters('game_id');
if('undefined' == typeof chat_room || !chat_room)
{
	chat_room = 'lobby';
}


//connect to the socket server

var socket = io.connect();

socket.on('log', function(array)
{
	console.log.apply(console, array);
});

//join room response
socket.on('join_room_response', function(payload){
	if(payload.result == 'fail')
	{
		alert(payload.message);
		return;
	}
	if(payload.socket_id == socket.id){
		return;
	}

	var dom_elements = $('.socket_' + payload.socket_id);
	if(dom_elements.length == 0){
		var nodeA = $('<div></div>');
		nodeA.addClass('socket_'+payload.socket_id);

		var nodeB = $('<div></div>');
		nodeB.addClass('socket_'+payload.socket_id);

		var nodeC = $('<div></div>');
		nodeC.addClass('socket_'+payload.socket_id);

		nodeA.addClass('w-100');

		nodeB.addClass('col-9 text-right');
		nodeB.append('<h4>'+payload.username+'</h4>');

		nodeC.addClass('col-3 text-left');
		var buttonC = makeInviteButton(payload.socket_id);
		nodeC.append(buttonC);

		nodeA.hide();
		nodeB.hide();
		nodeC.hide();
		$('#players').append(nodeA, nodeB, nodeC);
		nodeA.slideDown(1000);
		nodeB.slideDown(1000);
		nodeC.slideDown(1000);

	}
	else{
		uninvite(payload.socket_id);
		var buttonC = makeInviteButton(payload.socket_id);
		$('.socket_'+payload.socket_id+' button').replaceWith(buttonC);
		dom_elements.slideDown(1000);
	}

	var newHTML = '<p>' + payload.username + ' just entered the room</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').prepend(newNode);
	newNode.slideDown(1000);
});

//player disconnected
socket.on('player_disconnected', function(payload){
	if(payload.result == 'fail')
	{
		alert(payload.message);
		return;
	}
	if(payload.socket_id == socket.id){
		return;
	}

	var dom_elements = $('.socket_' + payload.socket_id);
	if(dom_elements.length != 0){
		dom_elements.slideUp(1000);
	}

	var newHTML = '<p>' + payload.username + ' has left the room</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').prepend(newNode);
	newNode.slideDown(1000);
});

//invite
function invite(who){
	var payload = {};
	payload.requested_user = who;

	console.log('*** Client Log Message: \'invite\' payload: ' + JSON.stringify(payload));
	socket.emit('invite', payload);
}

socket.on('invite_response', function(payload){
	if(payload.result == 'fail')
	{
		alert(payload.message);
		return;
	}
	var newNode = makeInvitedButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

socket.on('invited', function(payload){
	if(payload.result == 'fail')
	{
		alert(payload.message);
		return;
	}
	var newNode = makePlayButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

//uninvite
function uninvite(who){
	var payload = {};
	payload.requested_user = who;

	console.log('*** Client Log Message: \'uninvite\' payload: ' + JSON.stringify(payload));
	socket.emit('uninvite', payload);
}

socket.on('uninvite_response', function(payload){
	if(payload.result == 'fail')
	{
		alert(payload.message);
		return;
	}
	var newNode = makeInviteButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

socket.on('uninvited', function(payload){
	if(payload.result == 'fail')
	{
		alert(payload.message);
		return;
	}
	var newNode = makeInviteButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});


//game start
function game_start(who){
	var payload = {};
	payload.requested_user = who;

	console.log('*** Client Log Message: \'game_start\' payload: ' + JSON.stringify(payload));
	socket.emit('game_start', payload);
}


socket.on('game_start_response', function(payload){
	if(payload.result == 'fail')
	{
		alert(payload.message);
		return;
	}
	var newNode = makeEngageButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);

	window.location.href = 'game.html?username='+username+'&game_id='+payload.game_id;

});

//send message
function send_message()
{
	var payload = {};
	payload.room = chat_room;
	payload.username = username;
	payload.message = $('#send_message_holder').val();
	console.log('*** Client Log Message: \'send_message\' payload: ' + JSON.stringify(payload));
	socket.emit('send_message', payload);
	$('#send_message_holder').val('');
}

socket.on('send_message_response', function(payload){
	if(payload.result == 'fail')
	{
		alert(payload.message);
		return;
	}
	var newHTML = '<p><b>' + payload.username + ' says:</b> ' + payload.message + '</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').prepend(newNode);
	newNode.slideDown(1000);
});


function makeInviteButton(socket_id)
{
	var newHTML = '<button type=\'button\' class=\'btn btn-outline-primary\'>Invite</button>';
	var newNode = $(newHTML);
	newNode.click(function(){
		invite(socket_id);
	});
	return(newNode);
}

function makeInvitedButton(socket_id)
{
	var newHTML = '<button type=\'button\' class=\'btn btn-primary\'>Invited</button>';
	var newNode = $(newHTML);
	newNode.click(function(){
		uninvite(socket_id);
	});
	return(newNode);
}

function makePlayButton(socket_id)
{
	var newHTML = '<button type=\'button\' class=\'btn btn-success\'>Play</button>';
	var newNode = $(newHTML);
	newNode.click(function(){
		game_start(socket_id);
	});
	return(newNode);
}

function makeEngageButton()
{
	var newHTML = '<button type=\'button\' class=\'btn btn-danger\'>Engaged</button>';
	var newNode = $(newHTML);
	return(newNode);
}

$(function(){
	var payload = {};
	payload.room = chat_room;
	payload.username = username;

	console.log('***Client Log Message: \'join_room\' payload: ' + JSON.stringify(payload));
	socket.emit('join_room', payload);

	$('#quit').append('<a href="lobby.html?username='+username+'" class="btn btn-danger btn-default active" role = "button" aria-pressed="true">Quit</a>');


});
var table = document.getElementById("game_board");

table_string = ''

for (var row = 0; row < num; row++){
	table_string += "<tr>";
	for (var col = 0; col < num; col++){
		table_string += "<td id='"+row+"_"+col+"'></td>";
	}
	table_string += "</tr>";
}

table.innerHTML = table_string;

/*

 "<tr>" +
"              <td id='0_0'></td>" +
"               <td id='0_1'></td>" +
"                <td id='0_2'></td>" +
"                 <td id='0_3'></td>" +
"                  <td id='0_4'></td>" +
"                   <td id='0_5'></td>" +
"                    <td id='0_6'></td>" +
"                     <td id='0_7'></td>" +
"            </tr>" +
"            <tr>" +
"              <td id='1_0'></td>" +
"               <td id='1_1'></td>" +
"                <td id='1_2'></td>" +
"                 <td id='1_3'></td>" +
"                  <td id='1_4'></td>" +
"                   <td id='1_5'></td>" +
"                    <td id='1_6'></td>" +
"                     <td id='1_7'></td>" +
"            </tr>" +
"            <tr>" +
"              <td id='2_0'></td>" +
"               <td id='2_1'></td>" +
"                <td id='2_2'></td>" +
"                 <td id='2_3'></td>" +
"                  <td id='2_4'></td>" +
"                   <td id='2_5'></td>" +
"                    <td id='2_6'></td>" +
"                     <td id='2_7'></td>" +
"            </tr>" +
"            <tr>" +
"              <td id='3_0'></td>" +
"               <td id='3_1'></td>" +
"                <td id='3_2'></td>" +
"                 <td id='3_3'></td>" +
"                  <td id='3_4'></td>" +
"                   <td id='3_5'></td>" +
"                    <td id='3_6'></td>" +
"                     <td id='3_7'></td>" +
"            </tr>" +
"            <tr>" +
"              <td id='4_0'></td>" +
"               <td id='4_1'></td>" +
"                <td id='4_2'></td>" +
"                 <td id='4_3'></td>" +
"                  <td id='4_4'></td>" +
"                   <td id='4_5'></td>" +
"                    <td id='4_6'></td>" +
"                     <td id='4_7'></td>" +
"            </tr>" +
"            <tr>" +
"              <td id='5_0'></td>" +
"               <td id='5_1'></td>" +
"                <td id='5_2'></td>" +
"                 <td id='5_3'></td>" +
"                  <td id='5_4'></td>" +
"                   <td id='5_5'></td>" +
"                    <td id='5_6'></td>" +
"                     <td id='5_7'></td>" +
"            </tr>" +
"            <tr>" +
"              <td id='6_0'></td>" +
"               <td id='6_1'></td>" +
"                <td id='6_2'></td>" +
"                 <td id='6_3'></td>" +
"                  <td id='6_4'></td>" +
"                   <td id='6_5'></td>" +
"                    <td id='6_6'></td>" +
"                     <td id='6_7'></td>" +
"            </tr>" +
"            <tr>" +
"              <td id='7_0'></td>" +
"               <td id='7_1'></td>" +
"                <td id='7_2'></td>" +
"                 <td id='7_3'></td>" +
"                  <td id='7_4'></td>" +
"                   <td id='7_5'></td>" +
"                    <td id='7_6'></td>" +
"                     <td id='7_7'></td>" +
"            </tr>";*/


var old_board = [];

	
	for(var i = 0; i < num; i++)
	{
		old_board.push([]);
		for(var j = 0; j < num; j++)
		{
			old_board[i].push("?");
			console.log(old_board[i][j]);
		}
	}
/*
var old_board = [
					['?', '?', '?', '?', '?', '?', '?', '?'],
					['?', '?', '?', '?', '?', '?', '?', '?'],
					['?', '?', '?', '?', '?', '?', '?', '?'],
					['?', '?', '?', '?', '?', '?', '?', '?'],
					['?', '?', '?', '?', '?', '?', '?', '?'],
					['?', '?', '?', '?', '?', '?', '?', '?'],
					['?', '?', '?', '?', '?', '?', '?', '?'],
					['?', '?', '?', '?', '?', '?', '?', '?']
				];
*/
var my_color = ' ';
var interval_timer;

socket.on('game_update', function(payload){
		console.log('***Client Log Message: \'game_update\' payload: ' + JSON.stringify(payload));

		if(payload.result == 'fail'){
			console.log(payload.message);
			window.location.href = 'lobby.html?username='+username;
			return;
		}

		var board = payload.game.board;
		if('undefined' == typeof board || !board){
			console.log('Internal error: received a malformed board update from the server');
			return;
		}

		if(socket.id == payload.game.player_white.socket){
			my_color = 'white';
		}
		else if(socket.id == payload.game.player_black.socket){
			my_color = 'black';
		}
		else{
			window.location.href = 'lobby.html?username='+username;
			return;
		}

		$('#my_color').html('<h3 id="my_color">I am '+my_color+'</h3>');
		$('#my_color').append('<h4>It is ' +payload.game.whose_turn+'\'s turn. Elapsed time <span id="elapsed"></span></h4>');
		clearInterval(interval_timer);
		interval_timer = setInterval(function(last_time){
			return function(){
				var d = new Date();
				var elapsedmilli = d.getTime() - last_time;
				var minutes = Math.floor(elapsedmilli / (60*1000));
				var seconds = Math.floor((elapsedmilli % (60*1000))/1000);

				if(seconds < 10)
				{
					$('#elapsed').html(minutes+':0'+seconds);
				}
				else
				{
					$('#elapsed').html(minutes+':'+seconds);	
				}

			}
		}(payload.game.last_move_time)


			, 1000);

		var blacksum = 0;
		var whitesum = 0;

		var row, column;
		for(row =  0; row < num; row++)
		{
			for(column = 0; column < num; column++)
			{
				if(board[row][column] == 'b'){
					blacksum++;
				}
				if(board[row][column] == 'w'){
					whitesum++;
				}
				if(old_board[row][column] != board[row][column])
				{
					if(old_board[row][column] == '?' && board[row][column] == ' ')
					{
						$('#'+row+'_'+column).html('<img src="assets/images/empty.gif" alt="empty square"/>');
					}
					else if(old_board[row][column] == '?' && board[row][column] == 'w')
					{
						$('#'+row+'_'+column).html('<img src="assets/images/empty_to_white.gif" alt="white square"/>');
					}
					else if(old_board[row][column] == '?' && board[row][column] == 'b')
					{
						$('#'+row+'_'+column).html('<img src="assets/images/empty_to_black.gif" alt="black square"/>');
					}
					else if(old_board[row][column] == ' ' && board[row][column] == 'w')
					{
						$('#'+row+'_'+column).html('<img src="assets/images/empty_to_white.gif" alt="white square"/>');
					}
					else if(old_board[row][column] == ' ' && board[row][column] == 'b')
					{
						$('#'+row+'_'+column).html('<img src="assets/images/empty_to_black.gif" alt="black square"/>');
					}
					else if(old_board[row][column] == 'w' && board[row][column] == ' ')
					{
						$('#'+row+'_'+column).html('<img src="assets/images/white_to_empty.gif" alt="empty square"/>');
					}
					else if(old_board[row][column] == 'b' && board[row][column] == ' ')
					{
						$('#'+row+'_'+column).html('<img src="assets/images/black_to_empty.gif" alt="empty square"/>');
					}
					else if(old_board[row][column] == 'w' && board[row][column] == 'b')
					{
						$('#'+row+'_'+column).html('<img src="assets/images/white_to_black.gif" alt="black square"/>');
					}
					else if(old_board[row][column] == 'b' && board[row][column] == 'w')
					{
						$('#'+row+'_'+column).html('<img src="assets/images/black_to_white.gif" alt="white square"/>');
					}
					else
					{
						$('#'+row+'_'+column).html('<img src="assets/images/error.gif" alt="error"/>');
					}
				}
				$('#'+row+'_'+column).off('click');
				$('#'+row+'_'+column).removeClass('hovered_over');
				if(payload.game.whose_turn === my_color){
					if(payload.game.legal_moves[row][column] === my_color.substr(0, 1)){
						$('#'+row+'_'+column).addClass('hovered_over');
						$('#'+row+'_'+column).click(function(r, c){
							return function(){
								var payload = {};
								payload.row = r;
								payload.column = c;
								payload.color = my_color;
								console.log('*** Client Log Message: \'play_token\' payload: ' + JSON.stringify(payload));
								socket.emit('play_token', payload);
							};
						}(row, column));
					}
				}
			}
		}
		$('#blacksum').html(blacksum);
		$('#whitesum').html(whitesum);

		old_board = board;
});

socket.on('play_token_response', function(payload){
		console.log('***Client Log Message: \'play_token_response\' payload: ' + JSON.stringify(payload));

		if(payload.result == 'fail'){
			console.log(payload.message);
			alert(payload.message);
			return;
		}
});

socket.on('game_over', function(payload){
		console.log('***Client Log Message: \'game_over\' payload: ' + JSON.stringify(payload));

		if(payload.result == 'fail'){
			console.log(payload.message);
			alert(payload.message);
			return;
		}

		$('#game_over').html('<h1>Game Over</h1><h2>'+payload.who_won+ ' won!</h2>');
		$('#game_over').append('<a href="lobby.html?username='+username+'" class="btn btn-success btn-lg active" role = "button" aria-pressed="true">Return to the lobby</a>');
});