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

let players = {};

// Get usernames of online users
const getOnlinePlayers = () => {
  return Object.values(players);
}

io.on('connection', (socket) => {
	debug('A client connected!');

	socket.on('disconnect', () => {
    debug('Someone left the game :(');
    
    // broadcast to all connected sockets that this user has left the chat
	if (players[socket.id]) {
		socket.broadcast.emit('user-disconnected', players[socket.id]);
  }
  
  // remove user from list of connected users
	delete players[socket.id];
  });
  

  /**
  * Handle a new player
  */
   
  socket.on('register-user', (username, cb) => {
    debug("User '%s' connected to the game", username);

    const onlinePlayers = getOnlinePlayers();
    if(onlinePlayers.length > 1 ) {
      socket.emit('room-full');
      return;
    }

    players[socket.id] = username;


    cb({
      joinGame: true,
      usernameInUse: false,
      onlinePlayers: getOnlinePlayers(),
    });

    // broadcast to all connected sockets EXCEPT ourselves

    if(onlinePlayers.length === 1 ) {
      socket.broadcast.emit('new-user-connected', username);

      io.emit('start-game')
    }
	 /*  socket.broadcast.emit('new-user-connected', username); */

    // broadcast online users to all connected sockets EXCEPT ourselves
	  socket.broadcast.emit('online-users', getOnlinePlayers());

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
