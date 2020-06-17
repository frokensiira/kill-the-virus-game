/**
 * Socket Controller
 */

let playerProfiles = [];

let playerReady = 0;

let clickedVirus = 0;

let rounds = 0;

let playAgain = 0;

let xArray = [];
let yArray = [];

// Get usernames of online users
const getOnlinePlayers = function() {
	return playerProfiles.map(player => player.username);
}

const getScore = function() {
	return playerProfiles.map(player => player.score);
}

const calcRandomDelay = function() {
	return Math.floor(Math.random() * (3000 - 500) + 500);
}

const calcRandomPosition = function(x,y) {
  
	const randomX = Math.floor(Math.random()*x);
	const randomY = Math.floor(Math.random()*y);
	
	return [randomX,randomY];
}

const calcPoints = function(io, rounds) {
	
	const time = playerProfiles[0].reactionTime[rounds-1] - playerProfiles[1].reactionTime[rounds-1];

	if(time < 0) {
		playerProfiles[0].score += 1;
		
	} else {
		playerProfiles[1].score += 1;
	}

	const scoreResult = getScore();

	io.emit('score', scoreResult, rounds, playerProfiles);

	if(rounds < 10) {
        io.emit('start-game');
    } else {
		io.emit('end-game', scoreResult, playerProfiles);
	}

}

module.exports = function(socket) {

	const io = this;

	/**
	 * Handle a new player
	 */
   
	socket.on('register-user', function(username, cb) {

		// before registering a new player, check that the room isn't already full
		if(playerProfiles.length > 1 ) {
			socket.emit('room-full');
			return;
		}

		// create player
		playerProfile = {
			socketId: socket.id,
			username,
			reactionTime: [],
			score: 0,
		}

		// add the player to server player list
		playerProfiles.push(playerProfile);

		// create a response object
		const responseData = {
			playerOne: false,
			joinGame: true,
			playerOne: false,
			onlinePlayers: getOnlinePlayers(),
		}
			
		// check if the user is the first to be registered
		if(playerProfiles.length === 1 ) {
			responseData.playerOne = true;
		}

		// send the response object to the client
		cb(responseData);

		// check if the user is the second one to be registered 
		if(playerProfiles.length === 2 ) {

			// let the other user know that a new player joined
			socket.broadcast.emit('new-user-connected', username);

			// start the game
			io.emit('start-game');
		}

		// add new user to the other player's player list as well
		socket.broadcast.emit('online-users', getOnlinePlayers());

	});

	socket.on('set-random-data', function(x,y) {

		xArray.push(x);
		yArray.push(y);

		// check if both players are ready to play
		playerReady += 1;

		if(playerReady === playerProfiles.length) {

			//calculate the smallest measures to send for randomization
			const minX = Math.min(...xArray);
			const minY = Math.min(...yArray);

			io.emit('render-virus', calcRandomPosition(minX,minY), calcRandomDelay(), playerProfiles);
			playerReady = 0;
			xArray = [];
			yArray = [];
		}

	});

	socket.on('play-again', function() {

		// Reset the players score and reactionTimes
		const player = playerProfiles.find(element => element.socketId === socket.id);
		player.score = 0;
		player.reactionTime = [];
		rounds = 0;
				
		playAgain += 1;

		if(playAgain === 1) {
			socket.emit('new-round', playerProfiles, player);
		}

		// check that both players want to play before starting a new game
		if(playAgain === 2) {
			io.emit('reset-scoreboard');
			socket.broadcast.emit('new-user-connected', player.username);
			io.emit('start-game');

			playAgain = 0;
		}


	});

	socket.on('reaction-time', function(reactTime) {

		// add the reaction time to the players list
		const player = playerProfiles.find(player => player.socketId === socket.id);
		player.reactionTime.push(reactTime);

		// check that both players have clicked the virus before calculating the scores
		clickedVirus += 1;

		if(clickedVirus === playerProfiles.length) {
			clickedVirus = 0;
			rounds += 1;
			calcPoints(io, rounds);		
		}

	});
 
	socket.on('get-players', function(cb) {
		cb(playerProfiles);
	});

	socket.on('disconnect', function() {

		// check if player is registered
		const playerIsRegistered = playerProfiles.find(element => element.socketId === socket.id);

		if(playerIsRegistered) {

			// find the player that disconnected
			const player = playerProfiles.find(element => element.socketId === socket.id).username;

			// let the other player that stayed know that the this player left the game 
			if (player) {

				// only broadcast if there are more than one player
				if(playerProfiles.length > 1) {
					socket.broadcast.emit('user-disconnected', player);
				}
			 
				// remove player from server list
				const playerIndex = playerProfiles.findIndex(element => element.socketId === socket.id);
				playerProfiles.splice(playerIndex, 1);

				// reset 
				playerReady = 0;
				rounds = 0;
				playAgain = 0;
				
				// ask the client to remove the player from the player list
				socket.broadcast.emit('online-users', getOnlinePlayers());

			}

		}

	});
};
