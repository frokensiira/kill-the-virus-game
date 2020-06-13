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

let username = null;

// Functions

// Render players in the player list
const updateOnlinePlayers = (players) => {
	document.querySelector('#players-list').innerHTML = players.map(player => `<li class="player"><span class="fas fa-user"></span>${player}</li>`).join("");
}

/* const updateOnlinePlayers = (players) => {
	document.querySelector('#players-list').textContent = players.map(player => `${player}`);
} */

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
    //alert(`${username} joined the game`);
             
});

  
socket.on('start-game', () => {

    // Adding temporary virus to get measures, then remove it
    gameArea.append(virus);
    const x = gameArea.offsetHeight-virus.offsetHeight;
    const y = gameArea.offsetWidth-virus.offsetWidth;
    virus.remove();
    
    const measures = {x, y}

    console.log('this is measures', measures);

    socket.emit('set-random-position', measures);    
    console.log('this is start-game');

});

socket.on('render-virus', (xy) => {

    console.log('rendering the virus');
    virus.style.top = xy[0] + 'px';
    virus.style.left = xy[1] + 'px';

    gameArea.append(virus);
    const renderTime = Date.now();
    console.log('Virus rendered', renderTime);

    virus.addEventListener('click', e => {
        virus.remove();
        const clickTime = Date.now();
        console.log('Virus clicked', clickTime);

        const reactTime = clickTime - renderTime;
        console.log('reactionTime is', reactTime);

        socket.emit('reaction-time', reactTime)
    });
});

socket.on('user-disconnected', username => {
    console.log(`${username} left the game`);
    alert(`${username} left the game`)
});

socket.on('room-full', () => {
    alert('Player room is full, try again later');
});
