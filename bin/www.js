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

const playerProfiles = [];

let playerReady = 0;

// Get usernames of online users
const getOnlinePlayers = () => {
  return Object.values(players);
}

const calcRandomPosition = (measures) => {
  console.log('inside calcRandomPosition, measures is', measures);

      const randomX = Math.floor(Math.random()*measures.x);
      const randomY = Math.floor(Math.random()*measures.y);
      
      return [randomX,randomY];
}

// Someone connected
io.on('connection', (socket) => {
	debug('A client connected!');

  /**
  * Handle a new player
  */
   
  socket.on('register-user', (username, cb) => {
    debug("User '%s' connected to the game", username);

    // before registering a new player, check that the room isn't already full
    const onlinePlayers = getOnlinePlayers();
    if(onlinePlayers.length > 1 ) {
      socket.emit('room-full');
      return;
    }

    // add a check here to make sure the username is not already taken. Compare onlinePlayers with username. //

    // add username to players
    players[socket.id] = username;

    // trigger the callback function to answer the event from the client with some data 
    cb({
      joinGame: true,
      usernameInUse: false,
      onlinePlayers: getOnlinePlayers(),
    });

    
    // if there already is a player waiting, let her/him know that a new player joined and start the game
    if(onlinePlayers.length === 1 ) {
      socket.broadcast.emit('new-user-connected', username);

      io.emit('start-game')
    }

    // add new user to the other player's player list as well
	  socket.broadcast.emit('online-users', getOnlinePlayers());

  });

  socket.on('set-random-position', measures => {

    const onlinePlayers = getOnlinePlayers();

    playerReady += 1;
    if(playerReady === onlinePlayers.length) {
      io.emit('render-virus', calcRandomPosition(measures));
    }
    
    
  });

  socket.on('reaction-time', reactTime => {

    console.log('reactTime is', reactTime);

    const reactionTime = [];
    reactionTime.push(reactTime);

    console.log('this is reactionTime', reactionTime);

    console.log('this is socket id', socket.id);

/*     playerProfile = {
      socketId: socket.id,
      username: players[socket.id],
      reactionTime
    } */
  })

  socket.on('disconnect', () => {
    debug(`${players[socket.id]} left the game :(`);
    
    // let the player know that the other player left the game
    if (players[socket.id]) {
      socket.broadcast.emit('user-disconnected', players[socket.id]);
    
    // remove user from list of connected users
    delete players[socket.id];
    
    // make sure the player is removed from the list
    socket.broadcast.emit('online-users', getOnlinePlayers());
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
