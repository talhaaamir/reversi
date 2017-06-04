//*****************************************
//          Set up the static file server
//Include the static file webserver library
var static = require('node-static');

//Include the http server library
var http = require('http');

//Assume we are running on Heroku
var port = process.env.PORT;
var directory = __dirname + '/public';

//If we aren't on Heroku, then we need to readjust the port and directory info and we know that because the port won't be set
if(typeof port == 'undefined' || !port)
{
	directory = './public';
	port = 8080;
}

//Set up a static web-server that will deliver files from the filesystem
var file = new static.Server(directory);

//Construct an http server that gets files from the file server
var app = http.createServer(
	function(request,response)
	{
		request.addListener('end', 
			function()
			{
				file.serve(request, response);
			}
		).resume();
	}
    ).listen(port);
var blah = 'username';
console.log('The server is running');
//console.log(blah);
//***************************************
//          Set up the web socket server

var players = [];

var io = require('socket.io').listen(app);

io.sockets.on('connection', function(socket){

	log('Client connection by '+socket.id);

	function log()
	{
		var array = ['*** Server Log Message: '];
		for(var i = 0; i < arguments.length; i++)
		{
			array.push(arguments[i]);
			console.log(arguments[i]);
		}
		socket.emit('log', array);
		socket.broadcast.emit('log', array);
	}

	socket.on('join_room', function(payload){
		log('join_room command'+JSON.stringify(payload));
		if(('undefined' === typeof payload) || !payload)
		{
			var error_message = 'join_room had no payload, command aborted';
			log(error_message);
			socket.emit('join_room_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}

		var room = payload.room;
		if(('undefined' === typeof room) || !room)
		{
			var error_message = 'join_room did not specify a room, command aborted';
			log(error_message);
			socket.emit('join_room_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}

		var username = payload.username;
		if(('undefined' === typeof username) || !username)
		{
			var error_message = 'join_room did not specify a username, command aborted';
			log(error_message);
			socket.emit('join_room_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}

		players[socket.id] = {};
		players[socket.id].username = username;
		players[socket.id].room = room;

		socket.join(room);

		var roomObject = io.sockets.adapter.rooms[room];
		
		var numClients = roomObject.length;
		var success_data = {
							 result: 'success',
							 room: room,
							 username: username,
							 socket_id: socket.id,
							 membership: numClients
		};

		io.in(room).emit('join_room_response', success_data);

		for(var socket_in_room in roomObject.sockets){
			var success_data = {
							 result: 'success',
							 room: room,
							 username: players[socket_in_room].username,
							 socket_id: socket_in_room,
							 membership: numClients
			};
			socket.emit('join_room_response', success_data);
		}

		log('join_room_success');
		if(room !== 'lobby'){
			send_game_update(socket, room, 'initial update');
		}
	});

	socket.on('disconnect', function(socket){
		log('Client disconnected'+JSON.stringify(players[socket.id]));

		if('undefined' !== typeof players[socket.id] && players[socket.id]){
			var username = players[socket.id].username;
			var room = players[socket.id].room;
			var payload = {
							username: username,
							socket_id: socket.id
							};
			delete players[socket.id];
			io.in(room).emit('player_disconnected', payload);
		}
	});

	//send message
	socket.on('send_message', function(payload){
		log('server received a command', 'send_message', payload);
		if(('undefined' === typeof payload) || !payload)
		{
			var error_message = 'send_message had no payload, command aborted';
			log(error_message);
			socket.emit('send_message_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}

		var room = payload.room;
		if(('undefined' === typeof room) || !room)
		{
			var error_message = 'send_message did not specify a room, command aborted';
			log(error_message);
			socket.emit('send_message_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}

		var username = players[socket.id].username;
		if(('undefined' === typeof username) || !username)
		{
			var error_message = 'send_message did not specify a username, command aborted';
			log(error_message);
			socket.emit('send_message_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}

		var message = payload.message;
		if(('undefined' === typeof message) || !message)
		{
			var error_message = 'send_message did not specify a message, command aborted';
			log(error_message);
			socket.emit('send_message_response', {
												result: 'fail',
												message: error_message
												});
			return;
		}
	
		var success_data = {
							 result: 'success',
							 room: room,
							 username: username,
							 message: message
		};

		io.in(room).emit('send_message_response', success_data);
		log('Message sent to room ' + room + ' by ' + username + 'success');
	});

	socket.on('invite', function(payload){
		log('invite with '+JSON.stringify(payload));
		if(('undefined' === typeof payload) || !payload)
		{
			var error_message = 'invite had no payload, command aborted';
			log(error_message);
			socket.emit('invite_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}


		var username = players[socket.id].username;
		if(('undefined' === typeof username) || !username)
		{
			var error_message = 'invite cannot identiy who sent the message';
			log(error_message);
			socket.emit('invite_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}

		var requested_user = payload.requested_user;
		if(('undefined' === typeof requested_user) || !requested_user)
		{
			var error_message = 'invite did not specify a requested user';
			log(error_message);
			socket.emit('invite_response', {
												result: 'fail',
												message: error_message
												});
			return;
		}

		var room = players[socket.id].room;
		var roomObject = io.sockets.adapter.rooms[room];
		if(!roomObject.sockets.hasOwnProperty(requested_user)){
			var error_message = 'invite requested a user that was not in the room, command aborted';
			log(error_message);
			socket.emit('invite_response', {
												result: 'fail',
												message: error_message
											});
			return;
		}

		var success_data = {
							 result: 'success',
							 socket_id: requested_user
		};

		socket.emit('invite_response', success_data);

		var success_data = {
							 result: 'success',
							 socket_id: socket.id
		};
		socket.to(requested_user).emit('invited', success_data);
		log('invite successful');
	});

socket.on('uninvite', function(payload){
		log('uninvite with '+JSON.stringify(payload));
		if(('undefined' === typeof payload) || !payload)
		{
			var error_message = 'uninvite had no payload, command aborted';
			log(error_message);
			socket.emit('uninvite_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}


		var username = players[socket.id].username;
		if(('undefined' === typeof username) || !username)
		{
			var error_message = 'uninvite cannot identiy who sent the message';
			log(error_message);
			socket.emit('uninvite_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}

		var requested_user = payload.requested_user;
		if(('undefined' === typeof requested_user) || !requested_user)
		{
			var error_message = 'uninvite did not specify a requested user';
			log(error_message);
			socket.emit('uninvite_response', {
												result: 'fail',
												message: error_message
												});
			return;
		}

		var room = players[socket.id].room;
		var roomObject = io.sockets.adapter.rooms[room];
		if(!roomObject.sockets.hasOwnProperty(requested_user)){
			var error_message = 'uninvite requested a user that was not in the room, command aborted';
			log(error_message);
			socket.emit('uninvite_response', {
												result: 'fail',
												message: error_message
											});
			return;
		}

		var success_data = {
							 result: 'success',
							 socket_id: requested_user
		};

		socket.emit('uninvite_response', success_data);

		var success_data = {
							 result: 'success',
							 socket_id: socket.id
		};
		socket.to(requested_user).emit('uninvited', success_data);
		log('uninvite successful');
	});

socket.on('game_start', function(payload){
		log('game_start with '+JSON.stringify(payload));
		if(('undefined' === typeof payload) || !payload)
		{
			var error_message = 'game_start had no payload, command aborted';
			log(error_message);
			socket.emit('game_start_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}


		var username = players[socket.id].username;
		if(('undefined' === typeof username) || !username)
		{
			var error_message = 'game_start cannot identiy who sent the message';
			log(error_message);
			socket.emit('game_start_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}

		var requested_user = payload.requested_user;
		if(('undefined' === typeof requested_user) || !requested_user)
		{
			var error_message = 'uninvite did not specify a requested user';
			log(error_message);
			socket.emit('uninvite_response', {
												result: 'fail',
												message: error_message
												});
			return;
		}

		var room = players[socket.id].room;
		var roomObject = io.sockets.adapter.rooms[room];
		if(!roomObject.sockets.hasOwnProperty(requested_user)){
			var error_message = 'game_start requested a user that was not in the room, command aborted';
			log(error_message);
			socket.emit('game_start_response', {
												result: 'fail',
												message: error_message
											});
			return;
		}

		var game_id = Math.floor((1+Math.random()) *0x10000).toString(16).substring(1);

		var success_data = {
							 result: 'success',
							 socket_id: requested_user,
							 game_id: game_id
		};

		socket.emit('game_start_response', success_data);

		var success_data = {
							 result: 'success',
							 socket_id: socket.id,
							 game_id: game_id
		};
		socket.to(requested_user).emit('game_start_response', success_data);
		log('game_start successful');
	});


	socket.on('play_token', function(payload){
		log('play_token with '+JSON.stringify(payload));
		if(('undefined' === typeof payload) || !payload)
		{
			var error_message = 'play_token had no payload, command aborted';
			log(error_message);
			socket.emit('play_token_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}


		var player = players[socket.id];
		if(('undefined' === typeof player) || !player)
		{
			var error_message = 'server does not recognize you (try going back one screen)';
			log(error_message);
			socket.emit('play_token_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}


		var username = players[socket.id].username;
		if(('undefined' === typeof username) || !username)
		{
			var error_message = 'play_token cannot identify who sent the message';
			log(error_message);
			socket.emit('play_token_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}


		var game_id = players[socket.id].room;
		if(('undefined' === typeof game_id) || !game_id)
		{
			var error_message = 'play_token cannot find your game board';
			log(error_message);
			socket.emit('play_token_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}


		var row = payload.row;
		if(('undefined' === typeof row) || row < 0 || row > 7)
		{
			var error_message = 'play_token did not specify a valid row, command aborted';
			log(error_message);
			socket.emit('play_token_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}

		var column = payload.column;
		if(('undefined' === typeof column) || column < 0 || column > 7)
		{
			var error_message = 'play_token did not specify a valid column, command aborted';
			log(error_message);
			socket.emit('play_token_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}

		var color = payload.color;
		if(('undefined' === typeof color) || !color || (color != 'white' && color != 'black'))
		{
			var error_message = 'play_token did not specify a valid color, command aborted';
			log(error_message);
			socket.emit('play_token_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}

		var game = games[game_id];
		if(('undefined' === typeof game) || !game)
		{
			var error_message = 'play_token could not find your game board';
			log(error_message);
			socket.emit('play_token_response', {
												result: 'fail',
												message: error_message
											   });
			return;
		}

		var success_data = {
							result: 'success'
		};
		socket.emit('play_token_response', success_data);

		if(color == 'white'){
			game.board[row][column] = 'w';
			game.whose_turn = 'black';
		}
		else if(color == 'black'){
			game.board[row][column] = 'b';
			game.whose_turn = 'white';
		}

		var d = new Date();
		game.last_move_time = d.getTime();

		send_game_update(socket, game_id, 'played a token');

	});

});

var games = [];

function create_new_game(){
	var new_game = {};
	new_game.player_white = {};
	new_game.player_black = {};
	new_game.player_white.socket = '';
	new_game.player_white.username = '';
	new_game.player_black.socket = '';
	new_game.player_black.username = '';

	var d = new Date();
	new_game.last_move_time = d.getTime();

	new_game.whose_turn = 'white';

	new_game.board = [
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
						[' ', ' ', ' ', 'w', 'b', ' ', ' ', ' '],
						[' ', ' ', ' ', 'b', 'w', ' ', ' ', ' '],
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
					];

	return new_game;

}

function send_game_update(socket, game_id, message)
{
	if(('undefined' === typeof games[game_id]) || !games[game_id]){
		console.log('No game exists. Creating '+game_id+ ' for '+socket.id);
		games[game_id] = create_new_game();

	}

	var roomObject;
	var numClients;
	do{
		roomObject = io.sockets.adapter.rooms[game_id];
		numClients = roomObject.length;
		if(numClients > 2){
			console.log('Too many clients in room: '+game_id+' #: '+numClients);
			if(games[game_id].player_white.socket == roomObject.sockets[0]){
				games[game_id].player_white.socket = '';
				games[game_id].player_white.username = '';
			}
			if(games[game_id].player_black.socket == roomObject.sockets[0]){
				games[game_id].player_black.socket = '';
				games[game_id].player_black.username = '';
			}
			var sacrifice = Object.keys(roomObject.sockets)[0];
			io.of('/').connected[sacrifice].leave(game_id);
		}
	}
	while((numClients-1) > 2);

	if((games[game_id].player_white.socket != socket.id) && (games[game_id].player_black.socket != socket.id)){
		console.log('Player is not assigned a color: '+socket.id);
		if((games[game_id].player_black.socket != '') && (games[game_id].player_white.socket != '')){
			games[game_id].player_white.socket = '';
			games[game_id].player_white.username = '';
			games[game_id].player_black.socket = '';
			games[game_id].player_black.username = '';
		}
	}

	if(games[game_id].player_white.socket == ''){
		if(games[game_id].player_black.socket != socket.id){
			games[game_id].player_white.socket = socket.id;
			games[game_id].player_white.username = players[socket.id].username;
		}
	}

	if(games[game_id].player_black.socket == ''){
		if(games[game_id].player_white.socket != socket.id){
			games[game_id].player_black.socket = socket.id;
			games[game_id].player_black.username = players[socket.id].username;
		}
	}

	var success_data = {
						result: 'success',
						game: games[game_id],
						game_id: game_id
	};
	io.in(game_id).emit('game_update', success_data);

	var row, column;
	var count = 0;
	for(row = 0; row < 8; row++)
	{
		for(column = 0; column < 8; column++)
		{
			if(games[game_id].board[row][column] != ' '){
				count++;
			}
		}
	}
	if(count == 64)
	{
		var success_data = {
							result: 'success',
							game: games[game_id],
							who_won: 'everyone',
							game_id: game_id
		};
		io.in(game_id).emit('game_over'), success_data;

		setTimeout(function(id){
			return function(){
				delete games[id];
			}}(game_id), 60*60*1000);
		
	}
}
