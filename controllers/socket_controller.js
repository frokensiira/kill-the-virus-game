/**
 * Socket Controller
 */

const debug = require('debug');

let playerProfiles = [];

let playerReady = 0;

let clickedVirus = 0;

let rounds = 0;

let playAgain = 0;

// Get usernames of online users
const getOnlinePlayers = function() {

	return playerProfiles.map(player => player.username);
   
}

const getScore = function() {
	return playerProfiles.map(player => player.score);
}

const calcRandomDelay = function() {

	const x = Math.floor(Math.random() * (3000 - 500) + 500);
	return x;
}

const calcRandomPosition = function(measures) {
  
	const randomX = Math.floor(Math.random()*measures.x);
	const randomY = Math.floor(Math.random()*measures.y);
	
	return [randomX,randomY];
}

const calcPoints = function(io, rounds) {
	
	const time = playerProfiles[0].reactionTime[rounds-1] - playerProfiles[1].reactionTime[rounds-1];

	if(time < 0) {
		playerProfiles[0].score += 1;
		console.log(`${playerProfiles[0].username} got 1 point`);
		
	} else {
		playerProfiles[1].score += 1;
		console.log(`${playerProfiles[1].username} got 1 point`);
	}

	const scoreResult = getScore();
	//console.log('this is score result', scoreResult);
	//console.log('this is rounds', rounds);

	io.emit('score', scoreResult, rounds, playerProfiles);

	if(rounds < 2) {
		console.log('this is in start-game');
        io.emit('start-game');
    } else {
		console.log('this is in end-game');
		rounds = 0;
		io.emit('end-game', scoreResult, playerProfiles);
		
		console.log('rounds after end-game is now', rounds);
	}

}

module.exports = function(socket) {

	const io = this;

	debug('A client connected!');

  /**
  * Handle a new player
  */
   
  socket.on('register-user', function(username, cb) {
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

  //new experimental
  socket.on('set-random-data', function(measures) {
	//console.log('in set random-data');

  const onlinePlayers = getOnlinePlayers();

  playerReady += 1;

  if(playerReady === onlinePlayers.length) {
	io.emit('render-virus', calcRandomPosition(measures), calcRandomDelay(), playerProfiles);
	playerReady = 0;
  }

});

  // old
  /* socket.on('set-random-data', function(measures) {
	  //console.log('in set random-data');

	const onlinePlayers = getOnlinePlayers();

    playerReady += 1;

    if(playerReady === onlinePlayers.length) {
	  io.emit('render-virus', calcRandomPosition(measures), calcRandomDelay());
	  playerReady = 0;
	}

  }); */

  socket.on('play-again', function() {
	console.log('someone wants to play again, this is playerProfiles', playerProfiles);

	console.log('inside play-again: rounds is', rounds);
	rounds = 0;

	playAgain += 1;

	// Reset the players score and reactionTimes
	const player = playerProfiles.find(element => element.socketId === socket.id);
	player.score = 0;
	player.reactionTime = [];

	console.log('inside play-again: player is', player);

	if(playAgain === 1) {
		socket.emit('pOne-new-round', playerProfiles, player);
	}

	if(playAgain === 2) {
		io.emit('reset-scoreboard')
		io.emit('start-game');
	}


  });

  socket.on('reaction-time', function(reactTime) {
	
	const player = playerProfiles.find(player => player.socketId === socket.id);

	player.reactionTime.push(reactTime);

	clickedVirus += 1;

	if(clickedVirus === playerProfiles.length) {
		clickedVirus = 0;
		rounds += 1;
		calcPoints(io, rounds);		
	}

  })

  socket.on('disconnect', function() {
	
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

		// reset rounds
		rounds = 0;
		
		// make sure the player is removed from the list
		socket.broadcast.emit('online-users', getOnlinePlayers());
	
		console.log('this is playerProfiles in disconnect where playerprofiles should contain something: ', playerProfiles );
		}

  	}
  
  });
};
