const socket = io();

// Query DOM

const loginForm = document.querySelector('#login-form');
const start = document.querySelector('#start');
const game = document.querySelector('#game');
const gameArea = document.querySelector('#game-area');

// create virus
const virus = document.createElement('img');
virus.setAttribute("src", "./assets/images/a.svg"); 
virus.setAttribute("id", "virus");

const waitingInfo = document.createElement('h3');
waitingInfo.innerText = 'Waiting for a second player to join...';
waitingInfo.setAttribute("id", "waiting-text");

let username = null;

// Functions

// Render players in the player list
const updateOnlinePlayers = (players) => {
	document.querySelector('#players-list').innerHTML = players.map(player => `<li class="player"><span class="fas fa-user"></span>${player}</li>`).join("");
}


// Emit events

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
    console.log(`${username} connected to the game`);
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

    console.log('this is measures', measures);

    socket.emit('set-random-data', measures);    
    console.log('this is start-game');

});

socket.on('render-virus', (xy, randomDelay) => {

    console.log('rendering the virus');
    virus.style.top = xy[0] + 'px';
    virus.style.left = xy[1] + 'px';

    console.log('randomDealy is', randomDelay);

    let renderTime = null;
    setTimeout(() => {
        waitingInfo.remove();
        gameArea.append(virus);
        renderTime = Date.now();
        console.log('Virus rendered', renderTime);
    }, randomDelay)
    
    

    virus.addEventListener('click', e => {
        virus.remove();
        const clickTime = Date.now();
        console.log('Virus clicked', clickTime);

        const reactTime = clickTime - renderTime;
        console.log('reactionTime is', reactTime);

        socket.emit('reaction-time', reactTime)
    });00
});

socket.on('user-disconnected', username => {
    console.log(`${username} left the game`);
    alert(`${username} left the game`)
});

socket.on('room-full', () => {
    alert('Player room is full, try again later');
});
