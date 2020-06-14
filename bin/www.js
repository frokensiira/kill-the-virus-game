#!/usr/bin/env node

/**
 * Module dependencies.
 */

require('dotenv').config();

const app = require('../app');
const debug = require('debug')('kill-the-virus-my-siira:server');
const http = require('http');
const SocketIO = require('socket.io');

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);
const io = SocketIO(server);






































/* let players = {}; */

let playerProfiles = [];

let playerReady = 0;

let clickedVirus = 0;

let rounds = 0;

// Get usernames of online users
const getOnlinePlayers = () => {

	return playerProfiles.map(player => player.username);
   
}

const getScore = () => {
	return playerProfiles.map(player => player.score);
}

const calcRandomDelay = () => {

	const x = Math.floor(Math.random() * (3000 - 500) + 500);
	return x;
}

const calcRandomPosition = measures => {
  
	const randomX = Math.floor(Math.random()*measures.x);
	const randomY = Math.floor(Math.random()*measures.y);
	
	return [randomX,randomY];
}

const calcPoints = (rounds) => {
	console.log(`In calcpoints: this is ${playerProfiles[0].username}s time: ${playerProfiles[0].reactionTime[rounds-1]}`);

	const time = playerProfiles[0].reactionTime[rounds-1] - playerProfiles[1].reactionTime[rounds-1];

	if(time < 0) {
		playerProfiles[0].score += 1;
		console.log(`${playerProfiles[0].username} got 1 point`);
		
	} else {
		playerProfiles[1].score += 1;
		console.log(`${playerProfiles[1].username} got 1 point`);
	}

	const scoreResult = getScore();
	console.log('this is score result', scoreResult);
	console.log('this is rounds', rounds);

	io.emit('score', scoreResult, rounds);

	if(rounds < 10) {
		console.log('this is in start-game');
        io.emit('start-game');
    } else {
		console.log('this is in end-game');
		io.emit('end-game', scoreResult);
		rounds = 0;
		console.log('rounds after end-game is now', rounds);
	}

}

// Someone connected
io.on('connection', (socket) => {
	debug('A client connected!');

  /**
  * Handle a new player
  */
   
  socket.on('register-user', (username, cb) => {
    debug("User '%s' connected to the game", username);
	console.log('playerProfiles is', playerProfiles);
    // before registering a new player, check that the room isn't already full
	let onlinePlayers = getOnlinePlayers();
	
    if(onlinePlayers.length > 1 ) {
      socket.emit('room-full');
      return;
    }

    // add a check here to make sure the username is not already taken. Compare onlinePlayers with username. //
	
	// create player
	playerProfile = {
		socketId: socket.id,
		username,
		reactionTime: [],
		score: 0,
	}

	playerProfiles.push(playerProfile);

	const responseData = {
		playerOne: false,
		joinGame: true,
		usernameInUse: false,
		onlinePlayers: getOnlinePlayers(),
	}
      
	// check if the room is empty, i.e. registered user is the first to join
	if(onlinePlayers.length === 0 ) {
		responseData.playerOne = true;
	}

	cb(responseData);

    
    // if there already is a player waiting, let her/him know that a new player joined and start the game
    if(onlinePlayers.length === 1 ) {
      socket.broadcast.emit('new-user-connected', username);

	  io.emit('start-game');
    }

    // add new user to the other player's player list as well
	  socket.broadcast.emit('online-users', getOnlinePlayers());

  });

  socket.on('set-random-data', measures => {
	  //console.log('in set random-data');

	const onlinePlayers = getOnlinePlayers();

    playerReady += 1;

    if(playerReady === onlinePlayers.length) {
	  io.emit('render-virus', calcRandomPosition(measures), calcRandomDelay());
	  playerReady = 0;
	}

  });

  socket.on('reaction-time', reactTime => {
	
	const player = playerProfiles.find(player => player.socketId === socket.id);

	player.reactionTime.push(reactTime);

	clickedVirus += 1;

	if(clickedVirus === playerProfiles.length) {
		clickedVirus = 0;
		rounds += 1;
		calcPoints(rounds);		
	}

  })

  socket.on('disconnect', () => {
	
	console.log('someone disconnected');
	console.log('this is playerProfiles in disconnect', playerProfiles);

	if(playerProfiles.length !== 0) {
		const player = playerProfiles.find(element => element.socketId === socket.id).username;
	
		debug(`${player} left the game :(`);
	
		// let the player know that the other player left the game
		if (player) {
		  socket.broadcast.emit('user-disconnected', player);
		
		// remove player 
		const playerIndex = playerProfiles.findIndex(element => element.socketId === socket.id);
		playerProfiles.splice(playerIndex);
	
		// reset playerReady
		playerReady = 0;
		
		// make sure the player is removed from the list
		socket.broadcast.emit('online-users', getOnlinePlayers());
	
		console.log('this is playerProfiles in disconnect where playerprofiles should contain something: ', playerProfiles );
		}

  	}
  
  });
});

























/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
