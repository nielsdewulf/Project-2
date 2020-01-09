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
	avatar: undefined
};
let playerList = [];

const showNewLobby = data => {
	/**
	 * data.gameId
	 * data.PlayerCount
	 * data.MenuId
	 * data.Status
	 */
	console.log('New lobby with id: ' + data.gameId, data);
};
const createNewLobbyCallback = data => {
	console.error(data);
	let obj = {
		clientId: clientId,
		status: 'newLobby',
		lobby: data
	};
	// console.log(obj);
	mqttClient.publish(mainId, JSON.stringify(obj));
	showNewLobby(obj.lobby);
	lobbies.push(obj.lobby);
	lobbies.sort(function(a, b) {
		return a.menuId - b.menuId;
	});
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
	lobbies.forEach(lobby => {
		showNewLobby(lobby);
		console.log(lobby.gameId, lobby.menuId);
	});
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
		return;
	} else if (LobbyObj.playerCount == 2) {
		console.log("Cannot join lobby that's already full");
		return;
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

	let message = {
		playerCount: currentLobby.playerCount
	};

	handleData(`https://project2mct.azurewebsites.net/api/game/${gameId}`, data => {}, 'PUT', JSON.stringify(message));
};
const leaveLobby = () => {
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
};
const loadGame = () => {
	if (leaderboard === undefined) return;
	currentLobby.status = 2;
	let playersReady = true;
	playerList.forEach(el => {
		if (el.status !== 'connected') playersReady = false;
	});

	if (playerList.length !== 2) return;

	if (!playersReady) return;

	mqttClient.publish(
		`afloat/lobby/${lobbyId}`,
		JSON.stringify({
			clientId: clientId,
			status: 'startGameLobby'
		})
	);
	initialiseNewGame(true);
	mqttClient.publish(
		mainId,
		JSON.stringify({
			clientId: clientId,
			status: 'lobbyStarted',
			lobby: currentLobby
		})
	);
	let message = {
		status: 1
	};
	handleData(`https://project2mct.azurewebsites.net/api/game/${currentLobby.gameId}`, data => {}, 'PUT', JSON.stringify(message));

	console.log('Started Game');
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
};
const getTopHighscores = top => {
	return handleData(`https://project2mct.azurewebsites.net/api/scores/?top=${top}`, getTopHighscoresCallback);
};

const init = () => {
	// window.addEventListener('beforeunload', () => {
	// 	if (currentLobby !== undefined) {
	// 		leaveLobby();
	// 	}
	// });
	// window.addEventListener('blur', () => {
	// 	if (currentLobby !== undefined) {
	// 		leaveLobby();
	// 	}
	// });
	getTopHighscores(5);
	mqttClient.on('message', function(topic, message) {
		if (topic === mainId) {
			let data = JSON.parse(message);
			if (data.clientId === clientId) return;
			if (data.status === 'newLobby') {
				showNewLobby(data.lobby);
				lobbies.push(data.lobby);
				lobbies.sort(function(a, b) {
					return a.menuId - b.menuId;
				});
			}
			if (data.status === 'playerUpdate') {
				// showNewLobby(data.lobby);
				console.log('Lobby update', data.lobby);
				let lobby = getLobbyById(data.lobby.gameId);
				lobby.playerCount = data.lobby.playerCount;
			}
			if (data.status === 'lobbyStarted') {
				// showNewLobby(data.lobby);
				console.log('Lobby update', data.lobby);
				let lobby = getLobbyById(data.lobby.gameId);
				lobby.status = data.lobby.status;
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

				playerList.push(data.player);
			}
			if (data.status === 'connectionRequest') {
				if (playerList.length > 1) {
					playerList = [];
					playerList.push(currentPlayer);
				}
				console.log('Connection request from ' + data.clientId);
				playerList.push(data.player);
			}
			if (data.status === 'finalisedConnection') {
				console.log('Finalised connection request from ' + data.clientId);
				playerList.forEach(el => {
					if (el.clientId === data.clientId) {
						el.avatar = data.avatar;
						el.status = 'connected';
					}
				});
			}
			if (data.status === 'startGameLobby') {
				console.log('Started Game');
				initialiseNewGame(true);
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
	init();
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
