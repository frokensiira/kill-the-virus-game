const socket = io();

// Query DOM

const loginForm = document.querySelector('#login-form');
const start = document.querySelector('#start');
const game = document.querySelector('#game');
const virus = document.querySelector('#virus');

let username = null;

const updateOnlinePlayers = (players) => {
	document.querySelector('#players-list').innerHTML = players.map(player => `<li class="player">${player}</li>`).join("");
}

// Emit events
loginForm.addEventListener('submit', e => {
    e.preventDefault();

    username = document.querySelector('#username').value;
    socket.emit('register-user', username, (status) => {

        if(status.joinGame){
            start.classList.add('d-none');
            game.classList.remove('d-none');
            updateOnlinePlayers(status.onlinePlayers);
        }

/*         if(status.onlinePlayers.length === 2) {
            alert('Ready to start playing zome gamez?');
            socket.emit()
        } */

        //console.log('this is onlinePlayers now', status.onlinePlayers);
        
    });
    
});


//Listen for events
socket.on('reconnect', () => {
	if(username) {
		socket.emit('register-user', username, () => {
			console.log("Server acknowledged our reconnect :)");
		})
	}
});

socket.on('online-users', users => {
	updateOnlinePlayers(users)
});

socket.on('new-user-connected', username => {
    console.log(`${username} connected to the game`);
    //alert(`${username} joined the game`);

    

});

function getRandomPosition(element) {
    console.log('document is', document);
	const x = document.body.offsetHeight-element.clientHeight;
	const y = document.body.offsetWidth-element.clientWidth;
	const randomX = Math.floor(Math.random()*x);
	const randomY = Math.floor(Math.random()*y);
	return [randomX,randomY];
}


socket.on('start-game', () => {
    const virus = document.createElement('img');
    virus.setAttribute("src", "./assets/images/a.svg"); 
    virus.setAttribute("id", "virus");
    document.querySelector('#game-area').append(virus);
    const gameArea = document.querySelector('#game-area');
    console.log('this is document body', document.body);
    const xy = getRandomPosition(element);

    virus.style.top = xy[0] + 'px';
	virus.style.left = xy[1] + 'px';

    console.log('virus is', virus);

    virus.addEventListener('click', e => {
        console.log('someone clicked me');
        console.log(e.target);
    });
})

socket.on('user-disconnected', username => {
	console.log(`${username} left the game`);
});

socket.on('room-full', () => {
    alert('Player room is full, try again later');
});
