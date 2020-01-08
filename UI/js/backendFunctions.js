/**
 * Make sure MQTT Manager is loaded before this
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
	let obj = {
		clientId: clientId,
		status: 'newLobby',
		lobby: data
	};
	// console.log(obj);
	mqttClient.publish(mainId, JSON.stringify(obj));
	showNewLobby(obj.lobby);

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

	handleData('https://project2mct.azurewebsites.net/api/game/', createNewLobbyCallback, 'POST', JSON.stringify(message));
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
	console.log('Joined lobby with id: ' + gameId);
	playerList = [];
	currentLobby = getLobbyById(gameId);
	console.log(currentLobby);
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
	mqttClient.on('message', function(topic, message) {
		if (topic === `afloat/lobby/${lobbyId}`) {
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
			if (data.status === 'startGame') {
				console.log('Started Game');
			}
			if (data.status === 'disconnect') {
				playerList = [];
				playerList.push(currentPlayer);
			}
		}
	});

	let message = {
		playerCount: currentLobby.playerCount
	};

	handleData(`https://project2mct.azurewebsites.net/api/game/${gameId}`, , 'PUT', JSON.stringify(message));
};
const leaveLobby = () => {
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

	handleData(`https://project2mct.azurewebsites.net/api/game/${currentLobby.gameId}`, data => {}, 'P', JSON.stringify(message));
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
const startGame = (multiplayer = false) => {
	let playersReady = true;
	playerList.forEach(el => {
		if (el.status === 'finalising') playersReady = false;
	});

	if (multiplayer && playerList.length !== 2) return;

	if (!playersReady) return;

	mqttClient.publish(
		`afloat/lobby/${lobbyId}`,
		JSON.stringify({
			clientId: clientId,
			status: 'startGame'
		})
	);
	console.log('Started Game');
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
const init = () => {
	window.addEventListener('beforeunload', () => {
		if (currentLobby) {
			leaveLobby();
		}
	});
	window.addEventListener('blur', () => {
		if (currentLobby) {
			leaveLobby();
		}
	});
	mqttClient.on('message', function(topic, message) {
		if (topic === mainId) {
			let data = JSON.parse(message);
			if (data.clientId === clientId) return;
			if (data.status === 'newLobby') {
				showNewLobby(data.lobby);
			}
			if (data.status === 'playerUpdate') {
				// showNewLobby(data.lobby);
				console.log('Lobby update', data.lobby);
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
				return response.json();
			}
		})
		.then(function(jsonObject) {
			callback(jsonObject);
		})
		.catch(function(error) {
			console.error(`Error ${error}`);
		});
};
