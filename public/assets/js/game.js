const socket = io();

// Query DOM

const start = document.querySelector('#start');
const game = document.querySelector('#game');
const gameArea = document.querySelector('#game-area');
const resultContainer = document.querySelector('#result-container');

const playerOneScore = document.querySelector('#player-one-score');
const playerTwoScore = document.querySelector('#player-two-score');

const playerOneTime = document.querySelector('#player-one-time');
const playerTwoTime = document.querySelector('#player-two-time');

const winner = document.querySelector('#winner');
const gameResult = document.querySelector('#game-result');

// create virus
const virus = document.createElement('img');
virus.setAttribute("src", "./assets/images/a.svg"); 
virus.setAttribute("id", "virus");

const waitingInfo = document.createElement('h3');
const playAgainBtn = document.querySelector('#play-again');

let username = null;

let renderTime = null;
let stoppedTime = null;
let started = null;

// Functions

// Render players on scoreboard
const updateOnlinePlayers = (players) => {
	document.querySelector('#players-list').innerHTML = players.map(player => `<li class="player"><span class="fas fa-user"></span>${player}</li>`).join("");
};

// reset scoreboard
const resetScoreboard = () => {
    playerOneScore.innerText = `0`;
    playerTwoScore.innerText = `0`;
    playerOneTime.innerText = `00:00:00`;
    playerTwoTime.innerText = `00:00:00`;
};

// send out info 
const info = (text = 'Waiting for a second player to join...') => {
    waitingInfo.innerText = text;
    waitingInfo.setAttribute("id", "waiting-text");
    gameArea.append(waitingInfo);
}

// Event listeners

// Handle new player registration
document.querySelector('#login-form').addEventListener('submit', e => {
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

        if(status.playerOne){
            info();
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

// let player 1 know who joined the game
socket.on('new-user-connected', username => {
    info(`${username} joined the game. Prepare for virus extinction 😱`);
});


socket.on('start-game', () => {

    // Adding temporary virus to get measures, then remove it
    gameArea.append(virus);
    const x = gameArea.offsetHeight-virus.clientHeight;
    const y = gameArea.offsetWidth-virus.clientWidth;
    virus.remove();
    
    const measures = {x, y}

    // send measures to server for randomization
    socket.emit('set-random-data', measures);    

});


const startStopWatch = (playerProfiles) => {

    started = setInterval(function clockRunning(playerProfiles){
        const currentTime = new Date()
        const timeElapsed = new Date(currentTime - renderTime)
            

        const min = timeElapsed.getUTCMinutes()
        const sec = timeElapsed.getUTCSeconds()
        const ms = timeElapsed.getUTCMilliseconds();

    
        if(playerProfiles[0].socketId === socket.id) {
            playerOneTime.innerText = 

            (min > 9 ? min : "0" + min) + ":" + 
            (sec > 9 ? sec : "0" + sec) + ":" + 
            (ms > 99 ? ms : ms > 9 ? "0" + ms : "00" + ms);
        } else {
            playerTwoTime.innerText = 

            (min > 9 ? min : "0" + min) + ":" + 
            (sec > 9 ? sec : "0" + sec) + ":" + 
            (ms > 99 ? ms : ms > 9 ? "0" + ms : "00" + ms);
        }
    
        
    }, 10, playerProfiles);	
}

const stopStopWatch = () => {
    stoppedTime = new Date();
    clearInterval(started);
}

socket.on('render-virus', (xy, randomDelay, playerProfiles) => {

    virus.style.top = xy[0] + 'px';
    virus.style.left = xy[1] + 'px';

    setTimeout(() => {
        waitingInfo.remove();
        gameArea.append(virus);
        if(playerProfiles[0].socketId === socket.id){
            playerTwoTime.innerText = '00.00.000';
        } else if (playerProfiles[1].socketId === socket.id){
            playerOneTime.innerText = '00.00.000';
        }
        renderTime = new Date();
        startStopWatch(playerProfiles);
    }, randomDelay)

});


virus.addEventListener('click', e => {
    stopStopWatch();
    virus.remove();

    // Get the calculated time from stopwatch and transform it to a number for server to process
    socket.emit('get-players', (playerProfiles) => {

        if(playerProfiles[0].socketId === socket.id) {
            const timeString = playerOneTime.innerText;
            const reactTime = Number(timeString.replaceAll(':', ''));
            socket.emit('reaction-time', reactTime);
        } else if (playerProfiles[1].socketId === socket.id) {
            const timeString = playerTwoTime.innerText;
            const reactTime = Number(timeString.replaceAll(':', ''));
            socket.emit('reaction-time', reactTime);
        } else {
            console.log('something unexpected happened');
        }
    });

});

socket.on('score', (scoreResult, rounds, playerProfiles) => {

    playerOneScore.innerText = `${scoreResult[0]}`;
    playerTwoScore.innerText = `${scoreResult[1]}`;

    playerOneTime.innerText = `${playerProfiles[0].reactionTime[rounds-1]}`;
    playerTwoTime.innerText = `${playerProfiles[1].reactionTime[rounds-1]}`;

});

socket.on('end-game', (scoreResult, playerProfiles) => {
    
    resultContainer.classList.remove('d-none');

    document.querySelector('#player-one-result-list').innerHTML = playerProfiles[0].reactionTime.map(time => `<li class="player">${time/1000} s</li>`).join("");

    document.querySelector('#player-two-result-list').innerHTML = playerProfiles[1].reactionTime.map(time => `<li class="player">${time/1000} s</li>`).join("");

    document.querySelector('#player-one-result-heading').innerText = playerProfiles[0].username;
    document.querySelector('#player-two-result-heading').innerText = playerProfiles[1].username;

    if(scoreResult[0] === scoreResult[1]) {
        winner.innerText = "It's a tie!";
        gameResult.innerText = `${scoreResult[0]} against ${scoreResult[1]}, you should play again 😻`;
    } else if (scoreResult[0] > scoreResult[1]) {
        winner.innerText = `${playerProfiles[0].username} won!`;
        gameResult.innerText = `${scoreResult[0]} against ${scoreResult[1]}`;
    } else if(scoreResult[0] < scoreResult[1]) {
        winner.innerText = `${playerProfiles[1].username} won!`;
        gameResult.innerText = `${scoreResult[1]} against ${scoreResult[0]}`;
    } else {
        gameResult.innerText = "Result";
    }

});

 
playAgainBtn.addEventListener('click', e => {
    resultContainer.classList.add('d-none');
    socket.emit('play-again');
});

socket.on('new-round', (playerProfiles, player) => {

    if(playerProfiles.length > 1) {
        if(player.username === playerProfiles[0].username) {
            info(`Waiting for ${playerProfiles[1].username}...`)
        } else {
            info(`Waiting for ${playerProfiles[0].username}...`)
        }
    } else {
        info();
    }
    resetScoreboard();
    
});

socket.on('reset-scoreboard', () => {
    resetScoreboard();
});

socket.on('user-disconnected', username => {
    alert(`${username} left the game`);
    stopStopWatch();
    resetScoreboard();

    if(virus) {
        virus.remove();
    }
    
    const resultClass = document.querySelector("#result-container").getAttribute("class"); 

    if(resultClass !== '') {
        info();
    } 
    
});

socket.on('room-full', () => {
    alert('Player room is full, try again later');
});
