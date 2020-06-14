const socket = io();

// Query DOM

const loginForm = document.querySelector('#login-form');
const start = document.querySelector('#start');
const game = document.querySelector('#game');
const gameArea = document.querySelector('#game-area');
const resultContainer = document.querySelector('#result-container');

// create virus
const virus = document.createElement('img');
virus.setAttribute("src", "./assets/images/a.svg"); 
virus.setAttribute("id", "virus");

const waitingInfo = document.createElement('h3');
waitingInfo.innerText = 'Waiting for a second player to join...';
waitingInfo.setAttribute("id", "waiting-text");

const playAgainBtn = document.querySelector('#play-again');

let username = null;
let renderTime = null;

// Functions

// Render players on scoreboard
const updateOnlinePlayers = (players) => {
	document.querySelector('#players-list').innerHTML = players.map(player => `<li class="player"><span class="fas fa-user"></span>${player}</li>`).join("");
}

// Render score on scoreboard
const updateScore = (scoreResult) => {
	document.querySelector('#player-one-score').innerText = `${scoreResult[0]}`;
    document.querySelector('#player-two-score').innerText = `${scoreResult[1]}`;
}

// Render time on scoreboard
const updateTime = (time) => {
	document.querySelector('#player-one-score').innerText = `00:00:00`;
}


// Event listeners

// Handle new player registration
loginForm.addEventListener('submit', e => {
    e.preventDefault();

    username = document.querySelector('#username').value;
    socket.emit('register-user', username, (status) => {

        // if ok from server
        if(status.joinGame){
            // "send" player to game
            start.classList.add('d-none');
            game.classList.remove('d-none');

            // and update the player list
            updateOnlinePlayers(status.onlinePlayers);
        }

        // if ok from server
        if(status.playerOne){
            gameArea.append(waitingInfo);
        }

        return;
    });
    
});


//Listen for events


/* socket.on('reconnect', () => {
	if(username) {
		socket.emit('register-user', username, () => {
			console.log("Server acknowledged our reconnect :)");
		})
	}
}); */

// add new user to the other player's player list as well
socket.on('online-users', users => {
	updateOnlinePlayers(users)
});


// let player 1 know who joined the game, figure out how
socket.on('new-user-connected', username => {
    //console.log(`${username} connected to the game`);
    waitingInfo.innerText = `${username} joined the game. Prepare for virus extinction 😱`;
    gameArea.append(waitingInfo);

});

  
socket.on('start-game', () => {

    // Adding temporary virus to get measures, then remove it
    gameArea.append(virus);
    const x = gameArea.offsetHeight-virus.offsetHeight;
    const y = gameArea.offsetWidth-virus.offsetWidth;
    virus.remove();
    
    const measures = {x, y}

    //console.log('this is measures', measures);

    socket.emit('set-random-data', measures);    
    //console.log('this is start-game');

});

socket.on('render-virus', (xy, randomDelay) => {

    console.log('rendering the virus');
    virus.style.top = xy[0] + 'px';
    virus.style.left = xy[1] + 'px';

    //console.log('randomDealy is', randomDelay);

    /* let renderTime = null; */
    setTimeout(() => {
        waitingInfo.remove();
        gameArea.append(virus);
        renderTime = Date.now();
        console.log('Virus rendered', renderTime);
    }, randomDelay)

});

virus.addEventListener('click', e => {
    virus.remove();
    const clickTime = Date.now();
    //console.log('Virus clicked', clickTime);

    const reactTime = clickTime - renderTime;
    //console.log('reactionTime is', reactTime);

    socket.emit('reaction-time', reactTime)
    //console.log('this is socket', socket);
});

socket.on('score', (scoreResult, rounds) => {
    document.querySelector('#player-one-score').innerText = `${scoreResult[0]}`;
    document.querySelector('#player-two-score').innerText = `${scoreResult[1]}`;
    console.log('this is rounds', rounds);

});

socket.on('end-game', (scoreResult, playerProfiles) => {
    //alert(`End of game`);
    console.log('this is scoreResult', scoreResult);
    
    resultContainer.classList.remove('d-none');

    document.querySelector('#player-one-result-list').innerHTML = playerProfiles[0].reactionTime.map(time => `<li class="player">${time/1000} s</li>`).join("");

    document.querySelector('#player-two-result-list').innerHTML = playerProfiles[1].reactionTime.map(time => `<li class="player">${time/1000} s</li>`).join("");

    document.querySelector('#player-one-result-heading').innerText = playerProfiles[0].username;
    document.querySelector('#player-two-result-heading').innerText = playerProfiles[1].username;

    if(scoreResult[0] === scoreResult[1]) {
        console.log("It's a tie!");
    }

    console.log('this is playerProfiles', playerProfiles);
    //socket.emit('disconnect')
});

playAgainBtn.addEventListener('click', e => {
    resultContainer.classList.add('d-none');
    socket.emit('play-again');
});

socket.on('pOne-new-round', (playerProfiles, player) => {
    console.log('player is', player);

    console.log('player profile 0 is', playerProfiles[0].username);
    console.log('player profile 1 is', playerProfiles[1].username);

    if(player.username === playerProfiles[0].username) {
        waitingInfo.innerText = `Waiting for ${playerProfiles[1].username}...`;
        waitingInfo.setAttribute("id", "waiting-text");
        
    } else {
        waitingInfo.innerText = `Waiting for ${playerProfiles[0].username}...`;
        waitingInfo.setAttribute("id", "waiting-text");
    }

    gameArea.append(waitingInfo);
    document.querySelector('#player-one-score').innerText = `0`;
    document.querySelector('#player-two-score').innerText = `0`;

});

socket.on('user-disconnected', username => {
    console.log(`${username} left the game`);
    alert(`${username} left the game`);
    waitingInfo.innerText = 'Waiting for a second player to join...';
    gameArea.append(waitingInfo);
});

socket.on('room-full', () => {
    alert('Player room is full, try again later');
});
