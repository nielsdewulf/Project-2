/**
 * Make sure MQTT JS is loaded before this
 */
var clientId = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
let mainId = 'afloat/lobby/';
let lobbyId = undefined;

var mqttClient = mqtt.connect(`wss://mct-mqtt.westeurope.cloudapp.azure.com`, {
	protocolId: 'MQTT'
});
mqttClient.on('connect', function() {
	mqttClient.subscribe(mainId, function(err) {
		if (!err) {
			console.warn('Connected');
		} else {
			console.log(err);
		}
	});
});

/**
 * Make sure MQTT Manager is loaded before this
 */

/**
 * Lobby code
 */
let currentLobby;
let lobbies = [];
let currentPlayer = {
	clientId: clientId,
	status: 'finalising',
	avatar: undefined,
	offlinePlayer: true
};
let playerList = [];

// const showNewLobby = data => {
// 	/**
// 	 * data.gameId
// 	 * data.PlayerCount
// 	 * data.MenuId
// 	 * data.Status
// 	 */
// 	console.log('New lobby with id: ' + data.gameId, data);
// };
const createNewLobbyCallback = data => {
	console.error(data);
	let obj = {
		clientId: clientId,
		status: 'newLobby',
		lobby: data
	};
	// console.log(obj);
	mqttClient.publish(mainId, JSON.stringify(obj));
	lobbies.push(obj.lobby);
	lobbies.sort(function(a, b) {
		return a.menuId - b.menuId;
	});
	showNewLobbies(lobbies);
	joinLobby(obj.lobby.gameId);
};
const createNewLobby = () => {
	/**
	 * data.gameId
	 * data.PlayerCount
	 * data.MenuId
	 * data.Status
	 */
	let message = {
		PlayerCount: 0,
		Status: 0
	};

	handleData('https://project2mct.azurewebsites.net/api/game/', createNewLobbyCallback, 'POST', '{"PlayerCount":0,"Status":0}');
};
const getlobbiesCallback = data => {
	lobbies = data;
	lobbies.sort(function(a, b) {
		return a.menuId - b.menuId;
	});
	showNewLobbies(data);
	// lobbies.forEach(lobby => {

	// 	console.log(lobby.gameId, lobby.menuId);
	// });
};
const getlobbies = () => {
	/**
	 * data.gameId
	 * data.PlayerCount
	 * data.MenuId
	 * data.Status
	 */

	handleData('https://project2mct.azurewebsites.net/api/game/?status=0', getlobbiesCallback);
};
const joinLobby = gameId => {
	if (currentLobby !== undefined) {
		leaveLobby();
	}
	let LobbyObj = getLobbyById(gameId);
	if (LobbyObj === undefined) {
		console.log('Lobby does not exist');
		return false;
	} else if (LobbyObj.playerCount == 2) {
		console.log("Cannot join lobby that's already full");
		return false;
	} else {
		currentLobby = LobbyObj;
	}
	playerList = [];
	playerList.push(currentPlayer);
	console.log('Joined lobby with id: ' + gameId);

	currentLobby.playerCount++;
	mqttClient.publish(
		mainId,
		JSON.stringify({
			clientId: clientId,
			status: 'playerUpdate',
			lobby: currentLobby
		})
	);

	lobbyId = gameId;
	mqttClient.subscribe(`afloat/lobby/${lobbyId}`);
	mqttClient.publish(
		`afloat/lobby/${lobbyId}`,
		JSON.stringify({
			clientId: clientId,
			status: 'connected',
			player: currentPlayer
		})
	);
	document.querySelectorAll('.js-lobby-menu-id').forEach(el => {
		el.innerHTML = currentLobby.menuId;
	});
	document.querySelector('.js-main__lobbychoice').classList.add('c-hidden');
	document.querySelector('.js-main__avatar-multiplayer').classList.remove('c-hidden');

	let message = {
		playerCount: currentLobby.playerCount
	};

	handleData(`https://project2mct.azurewebsites.net/api/game/${gameId}`, data => {}, 'PUT', JSON.stringify(message));
	return true;
};
const leaveLobby = () => {
	clearPlayerList();
	if (currentLobby.status === 2) return;
	console.log('leftLobby');
	mqttClient.publish(
		`afloat/lobby/${lobbyId}`,
		JSON.stringify({
			clientId: clientId,
			status: 'disconnect'
		})
	);

	currentLobby.playerCount--;
	mqttClient.publish(
		mainId,
		JSON.stringify({
			clientId: clientId,
			status: 'playerUpdate',
			lobby: currentLobby
		})
	);
	let message = {
		PlayerCount: currentLobby.playerCount
	};

	handleData(`https://project2mct.azurewebsites.net/api/game/${currentLobby.gameId}`, data => {}, 'PUT', JSON.stringify(message));
	currentLobby = undefined;
};
const finaliseConnection = avatarId => {
	currentPlayer.avatar = avatarId;
	currentPlayer.status = 'connected';
	mqttClient.publish(
		`afloat/lobby/${lobbyId}`,
		JSON.stringify({
			clientId: clientId,
			status: 'finalisedConnection',
			avatar: currentPlayer.avatar
		})
	);
	showNewPlayer(currentPlayer);
};
const loadGame = () => {
	if (leaderboard === undefined) return false;
	currentLobby.status = 2;
	let playersReady = true;
	playerList.forEach(el => {
		if (el.status !== 'connected') playersReady = false;
	});

	if (playerList.length !== 2) return false;

	if (!playersReady) return false;

	mqttClient.publish(
		`afloat/lobby/${lobbyId}`,
		JSON.stringify({
			clientId: clientId,
			status: 'startGameLobby'
		})
	);
	initialiseNewGame(currentPlayer.avatar, true);
	mqttClient.publish(
		mainId,
		JSON.stringify({
			clientId: clientId,
			status: 'lobbyStarted',
			lobby: currentLobby
		})
	);

	lobbies.pop(currentLobby);
	showNewLobbies(lobbies);

	let message = {
		status: 1
	};
	handleData(`https://project2mct.azurewebsites.net/api/game/${currentLobby.gameId}`, data => {}, 'PUT', JSON.stringify(message));

	console.log('Started Game');
	return true;
};
const endGameLobby = () => {
	let message = {
		status: 2
	};
	handleData(`https://project2mct.azurewebsites.net/api/game/${currentLobby.gameId}`, data => {}, 'PUT', JSON.stringify(message));
	leaveLobby();
};
const getLobbyById = id => {
	let result;
	lobbies.forEach(lobby => {
		if (lobby.gameId === id) {
			result = lobby;
		}
	});
	return result;
};

/**
 * Leaderboard code
 */
var leaderboard = undefined;

const getTopHighscoresCallback = data => {
	leaderboard = data;
	leaderboard.sort(function(a, b) {
		return b.score - a.score;
	});
	showLeaderboard(leaderboard);
};
const getTopHighscores = top => {
	return handleData(`https://project2mct.azurewebsites.net/api/scores/?top=${top}`, getTopHighscoresCallback);
};

const initBackend = () => {
	window.addEventListener('beforeunload', () => {
		if (currentLobby !== undefined) {
			leaveLobby();
		}
	});
	window.addEventListener('blur', () => {
		if (currentLobby !== undefined) {
			leaveLobby();
		}
	});
	getTopHighscores(5);
	mqttClient.on('message', function(topic, message) {
		if (topic === mainId) {
			let data = JSON.parse(message);
			if (data.clientId === clientId) return;
			if (data.status === 'newLobby') {
				lobbies.push(data.lobby);
				lobbies.sort(function(a, b) {
					return a.menuId - b.menuId;
				});
				showNewLobbies(lobbies);
			}
			if (data.status === 'playerUpdate') {
				// showNewLobby(data.lobby);
				console.log('Lobby update', data.lobby);
				let lobby = getLobbyById(data.lobby.gameId);
				lobby.playerCount = data.lobby.playerCount;
				showNewLobbies(lobbies);
			}
			if (data.status === 'lobbyStarted') {
				// showNewLobby(data.lobby);
				console.log('Lobby update', data.lobby);
				let lobby = getLobbyById(data.lobby.gameId);
				lobby.status = data.lobby.status;
				lobbies.pop(lobby);
				showNewLobbies(lobbies);
			}
		}
	});
	mqttClient.on('message', function(topic, message) {
		if (lobbyId !== undefined && topic === `afloat/lobby/${lobbyId}`) {
			let data = JSON.parse(message);
			if (data.clientId === clientId) return;
			if (data.status === 'connected') {
				if (playerList.length > 1) {
					playerList = [];
					playerList.push(currentPlayer);
				}
				mqttClient.publish(
					topic,
					JSON.stringify({
						clientId: clientId,
						status: 'connectionRequest',
						player: currentPlayer
					})
				);
				console.log('Connection request from ' + data.clientId);
				data.player.offlinePlayer = false;
				playerList.push(data.player);
				if (data.player.avatar !== undefined) {
					showNewPlayer(data.player);
				}
			}
			if (data.status === 'connectionRequest') {
				if (playerList.length > 1) {
					playerList = [];
					playerList.push(currentPlayer);
				}
				console.log('Connection request from ' + data.clientId);
				data.player.offlinePlayer = false;
				playerList.push(data.player);
				if (data.player.avatar !== undefined) {
					showNewPlayer(data.player);
				}
			}
			if (data.status === 'finalisedConnection') {
				console.log('Finalised connection request from ' + data.clientId);
				playerList.forEach(el => {
					if (el.clientId === data.clientId) {
						el.avatar = data.avatar;
						el.status = 'connected';
						showNewPlayer(el);
					}
				});
			}
			if (data.status === 'startGameLobby') {
				console.log('Started Game');
				document.querySelector('.js-main__lobby').classList.add('c-hidden');
				initialiseNewGame(currentPlayer.avatar, true);
				document.querySelector('.js-game').classList.remove('c-hidden');
			}
			if (data.status === 'disconnect') {
				playerList = [];
				playerList.push(currentPlayer);
			}
		}
	});

	getlobbies();
	// joinLobby('663580E9-46C8-4637-BB78-05688B9604E4');
};

document.addEventListener('DOMContentLoaded', function() {
	initBackend();
});

const handleData = function(url, callback = data => {}, method = 'GET', body = null) {
	fetch(url, {
		method: method,
		body: body,
		headers: { 'content-type': 'application/json' }
	})
		.then(function(response) {
			if (!response.ok) {
				throw Error(`Problem with fetch(). Status Code: ${response.status}`);
			} else {
				return response.text();
			}
		})
		.then(function(textObject) {
			if (textObject != '') callback(JSON.parse(textObject));
		});
};
const get = async url => {
	let f = await fetch(url, {
		headers: {
			Accept: 'application/json'
		}
	});
	return f.json();
};
