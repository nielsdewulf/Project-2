const BASE_URL = 'https://project2mct.azurewebsites.net/api/';

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
let isLoadingGame = false;

/**
 * Callback for createNewLobby
 * @param {JSON} data
 */
const createNewLobbyCallback = data => {
	console.error(data);
	let obj = {
		clientId: clientId,
		status: 'newLobby',
		lobby: data
	};

	console.log(obj.lobby);

	obj.lobby.latestUpdate = new Date().getTime();

	//Send new lobby update to all other clients
	mqttClient.publish(mainId, JSON.stringify(obj));

	//Add lobby to list
	lobbies.push(obj.lobby);
	//Sort the lobby list
	lobbies.sort(function(a, b) {
		return a.menuId - b.menuId;
	});
	//Show the lobbies
	showNewLobbies(lobbies);

	//Join the lobby
	joinLobby(obj.lobby.gameId);
};

/**
 * Creates a new lobby
 */
const createNewLobby = () => {
	/**
	 * data.gameId
	 * data.PlayerCount
	 * data.MenuId
	 * data.Status
	 */
	let message = {
		PlayerCount: 0,
		Status: 0,
		ModeId: modi.indexOf(modus)
	};

	handleData(BASE_URL + 'games/', createNewLobbyCallback, 'POST', JSON.stringify(message));
};

/**
 * Callback for getLobbies
 * @param {JSON} data
 */
const getLobbiesCallback = data => {
	lobbies = data;
	lobbies.sort(function(a, b) {
		return a.menuId - b.menuId;
	});
	lobbies.forEach(el => {
		el.latestUpdate = new Date().getTime();
	});
	pingPlayers();
	showNewLobbies(data);
};

/**
 * Gets all lobbies
 */
const getLobbies = () => {
	/**
	 * data.gameId
	 * data.PlayerCount
	 * data.MenuId
	 * data.Status
	 */

	handleData(BASE_URL + 'games/?status=0', getLobbiesCallback);
};

/**
 * Joins a specified lobby
 * @param {string} gameId
 * Returns True if operation has finished successfully
 */
const joinLobby = gameId => {
	//If already in lobby leave the other one first
	if (currentLobby !== undefined) {
		leaveLobby();
	}

	//Check if lobby exists and is not full
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
	let finished = false;
	let random = Math.random() * 200;

	setTimeout(() => {
		handleData(BASE_URL + `games/${gameId}/join`, data => {
			if (data.status === 'Ok') {
				finished = true;

				modus = modi[LobbyObj.modeId];
				//Reset playerList
				playerList = [];
				playerList.push(currentPlayer);

				console.log('Joined lobby with id: ' + gameId);

				//Reset isLoadingGame
				isLoadingGame = false;

				//Update playerCount
				if (currentLobby.playerCount !== 2) currentLobby.playerCount++;

				mqttClient.publish(
					mainId,
					JSON.stringify({
						clientId: clientId,
						status: 'playerUpdate',
						lobby: currentLobby
					})
				);

				//Set gameId as lobbyId
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

				//Show correct menu id
				document.querySelectorAll('.js-lobby-menu-id').forEach(el => {
					el.innerHTML = currentLobby.menuId;
				});

				//Show avatar choice page
				document.querySelector('.js-main__lobbychoice').classList.add('u-hidden');
				document.querySelector('.js-main__avatar-multiplayer').classList.remove('u-hidden');

				return true;
			} else {
				currentLobby = undefined;
				finished = false;
			}
		});
	}, random);

	return finished;
};

/**
 * Leaves the current lobby
 */
const leaveLobby = () => {
	clearPlayerList();

	if (currentLobby.status === undefined) return;
	//If game has already ended -> do nothing
	if (currentLobby.status === 1) return;

	if (!isLoadingGame) {
		document.querySelector('.js-main__lobby').classList.add('u-hidden');
		document.querySelector('.js-main__lobbychoice').classList.remove('u-hidden');
	}

	currentPlayer.avatar = undefined;
	currentPlayer.status = 'connected';

	console.log('leftLobby');
	mqttClient.publish(
		`afloat/lobby/${lobbyId}`,
		JSON.stringify({
			clientId: clientId,
			status: 'disconnect',
			player: currentPlayer
		})
	);
	if (currentLobby.playerCount !== 0) currentLobby.playerCount--;
	mqttClient.publish(
		mainId,
		JSON.stringify({
			clientId: clientId,
			status: 'playerUpdate',
			lobby: currentLobby
		})
	);
	showNewLobbies(lobbies);
	mqttClient.unsubscribe(`afloat/lobby/${lobbyId}`);

	//Update playerCount in database
	let message = {
		PlayerCount: currentLobby.playerCount
	};

	handleData(BASE_URL + `games/${currentLobby.gameId}`, data => {}, 'PUT', JSON.stringify(message));
	currentLobby = undefined;
};

/**
 * Finalises the connection with the avatar the user has chosen
 * @param {int} avatarId
 */
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

	//Show player in list
	showPlayers(playerList);
};

/**
 * LoadsTheGame
 */
const loadGame = () => {
	//If game is already loading -> do nothing
	if (isLoadingGame) return false;

	//If leaderboard is not loaded -> do nothing
	if (leaderboard === undefined) return false;

	//If there are 2 players
	if (playerList.length !== 2) return false;

	//Check if all players are ready
	let playersReady = true;
	playerList.forEach(el => {
		if (el.status !== 'connected') playersReady = false;
	});

	//If not all players are ready
	if (!playersReady) return false;

	//Remove lobby from list
	lobbies.pop(currentLobby);

	//Update lobby status
	currentLobby.status = 1;

	//Set isLoadingGame
	isLoadingGame = true;
	mqttClient.publish(
		`afloat/lobby/${lobbyId}`,
		JSON.stringify({
			clientId: clientId,
			status: 'startGameLobby'
		})
	);

	//Initialise a new game
	let otherPlayer;
	playerList.forEach(p => {
		if (!p.offlinePlayer) otherPlayer = p;
	});
	initialiseNewGame(currentPlayer, otherPlayer, true);

	mqttClient.publish(
		mainId,
		JSON.stringify({
			clientId: clientId,
			status: 'lobbyStarted',
			lobby: currentLobby
		})
	);

	//Reload lobby list
	showNewLobbies(lobbies);

	//Start the game in the database
	let message = {
		status: 1
	};
	handleData(BASE_URL + `games/${currentLobby.gameId}`, data => {}, 'PUT', JSON.stringify(message));

	console.log('Started Game');

	return true;
};

/**
 * End the gamelobby
 */
const endGameLobby = () => {
	//Update the database that the game has ended
	let message = {
		status: 2
	};
	handleData(BASE_URL + `games/${lobbyId}`, data => {}, 'PUT', JSON.stringify(message));
	leaveLobby();
};

/**
 * Get lobby by gameId
 * @param {string} id
 */
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
 * PingPlayers to correct the playerCount of lobbies
 */
const pingPlayers = () => {
	try {
		//Reset playersResponded from playerCalls before back to 0
		lobbies.forEach(el => {
			if (el.status !== 2) {
				el.playersResponded = 0;
			}
		});

		//Publish a playerCall
		mqttClient.publish(
			mainId,
			JSON.stringify({
				clientId: clientId,
				status: 'playerCall'
			})
		);
		//Add yourself to the list
		if (currentLobby !== undefined) {
			let lobby = getLobbyById(currentLobby.gameId);
			lobby.playersResponded++;
		}

		let playerCallStarted = new Date().getTime();
		/**
		 * Timeout: after a second it'll check who responded
		 * 1second should be sufficient for the load the MQTT server could get.
		 */
		setTimeout(() => {
			lobbies.forEach(el => {
				if (el.status !== 2 && el.playersResponded !== undefined) {
					console.warn(`Updated playerCount from ${el.playerCount} to ${el.playersResponded}`);
					if (el.playerCount !== el.playersResponded) {
						if (el.latestUpdate < playerCallStarted) {
							el.playerCount = el.playersResponded;

							if (playerList.length > el.playersResponded) {
								playerList = [];
								playerList.push(currentPlayer);
								showPlayers(playerList);
							}
							// mqttClient.publish(
							// 	mainId,
							// 	JSON.stringify({
							// 		clientId: clientId,
							// 		status: 'playerUpdate',
							// 		lobby: el
							// 	})
							// );
							el.latestUpdate = new Date().getTime();
							let message = {
								PlayerCount: el.playerCount
							};

							handleData(BASE_URL + `games/${el.gameId}`, data => {}, 'PUT', JSON.stringify(message));
						}
					}
				}
			});
			showNewLobbies(lobbies);
		}, 1000);
	} catch (ex) {}
};

/**
 * Leaderboard code
 */
var leaderboard = undefined;

/**
 * Callback for getTopHighscores
 * @param {JSON} data
 */
const getTopHighscoresCallback = data => {
	leaderboard = data;
	leaderboard.sort(function(a, b) {
		return b.score - a.score;
	});
	showLeaderboard(leaderboard);
};

/**
 * Get Top Highscores
 * @param {int} top Gets only the top x highscores
 */
const getTopHighscores = top => {
	console.warn('loading leaderboard data');
	handleData(BASE_URL + `scores/?top=${top}`, getTopHighscoresCallback);
};

const saveHighscoreCallback = data => {
	mqttClient.publish(
		mainId,
		JSON.stringify({
			clientId: clientId,
			status: 'newHighscore'
		})
	);
	getTopHighscores(5);
};

/**
 *
 * @param {string} name
 * @param {int} score
 * @param {string} gameid
 */
const saveHighscore = (name, score, gameid = null, avatar) => {
	let obj = {
		Name: name,
		Score: score,
		GameId: gameid,
		Avatar: avatar
	};
	console.log(obj);
	handleData(BASE_URL + `scores/`, saveHighscoreCallback, 'POST', JSON.stringify(obj));
};

/**
 * Initialise the backend
 */
const initBackend = () => {
	//When user quits the page
	window.addEventListener('beforeunload', () => {
		if (currentLobby !== undefined) {
			leaveLobby();
		}
	});

	try {
		document.addEventListener('fullscreenchange', exitLobbyHandler);
		document.addEventListener('mozfullscreenchange', exitLobbyHandler);
		document.addEventListener('MSFullscreenChange', exitLobbyHandler);
		document.addEventListener('webkitfullscreenchange', exitLobbyHandler);
	} catch (ex) {}

	//When user switches tabs
	window.addEventListener('blur', () => {
		if (currentLobby !== undefined) {
			leaveLobby();
		}
	});

	//Get the top highscores on page load
	getTopHighscores(5);

	/**
	 * Interval for playerCount checking
	 */
	setInterval(() => {
		pingPlayers();
	}, 4000);
	/**
	 * Register Lobby listener
	 */
	mqttClient.on('message', function(topic, message) {
		//If topic is the game topic
		if (topic === mainId) {
			//Parse the text message as JSON data
			let data = JSON.parse(message);

			//Skip all messages from itself
			if (data.clientId === clientId) return;

			/**
			 * Status newLobby
			 */
			if (data.status === 'newLobby') {
				//Show new lobby
				data.lobby.latestUpdate = new Date().getTime();
				lobbies.push(data.lobby);

				lobbies.sort(function(a, b) {
					return a.menuId - b.menuId;
				});
				console.log(data.lobby);

				showNewLobbies(lobbies);
			}

			/**
			 * Status playerUpdate
			 */
			if (data.status === 'playerUpdate') {
				//updates the lobbies
				console.log('Lobby update', data.lobby);
				let lobby = getLobbyById(data.lobby.gameId);
				if (lobby !== undefined) {
					lobby.latestUpdate = new Date().getTime();

					lobby.playerCount = data.lobby.playerCount;
					showNewLobbies(lobbies);
				}
			}

			/**
			 * Status lobbyStarted
			 */
			if (data.status === 'lobbyStarted') {
				//Removes lobby
				console.log('Lobby update', data.lobby);
				let lobby = getLobbyById(data.lobby.gameId);
				lobby.status = data.lobby.status;
				lobby.latestUpdate = new Date().getTime();
				lobbies.pop(lobby);
				showNewLobbies(lobbies);
			}

			/**
			 * Status newHighscore
			 */
			if (data.status === 'newHighscore') {
				getTopHighscores(5);
			}

			// if (data.status === 'joiningLobby') {
			// 	if(host && currentLobby !== undefined){
			// 		if(currentLobby.gameId === data.lobby.gameId){
			// 			if(playerList.length == 2){
			// 				mqttClient.publish(
			// 					topic,
			// 					JSON.stringify({
			// 						clientId: clientId,
			// 						receiver: data.clientId,
			// 						status: 'joiningLobbyResponse',
			// 						lobby: currentLobby,
			// 						canJoin: false
			// 					})
			// 				);
			// 			}else{
			// 				mqttClient.publish(
			// 					topic,
			// 					JSON.stringify({
			// 						clientId: clientId,
			// 						receiver: data.clientId,
			// 						status: 'joiningLobbyResponse',
			// 						lobby: currentLobby,
			// 						canJoin: true
			// 					})
			// 				);
			// 			}
			// 		}
			// 	}
			// }
			// if (data.status === 'joiningLobbyResponse') {
			// 	if(data.receiver === clientId){
			// 		joinLobby(data.currentLobby.lobby)
			// 	}
			// }
			/**
			 * when a player issues a playerCall
			 */
			if (data.status === 'playerCall') {
				if (currentLobby !== undefined)
					mqttClient.publish(
						topic,
						JSON.stringify({
							clientId: clientId,
							receiver: data.clientId,
							status: 'playerCallPong',
							lobby: currentLobby
						})
					);
			}
			/**
			 * When a player responds to your playerCall
			 */
			if (data.status === 'playerCallPong') {
				if (data.receiver === clientId) {
					let lobby = getLobbyById(data.lobby.gameId);

					try {
						lobby.playersResponded++;
					} catch (ex) {}
				}
			}
		}
	});

	/**
	 * Mqtt message listener for lobby updates
	 */
	mqttClient.on('message', function(topic, message) {
		//Check if topic matches current lobby
		if (lobbyId !== undefined && topic === `afloat/lobby/${lobbyId}`) {
			//Parses the JSON data
			let data = JSON.parse(message);

			//Skips messages by itself
			if (data.clientId === clientId) return;

			if (data.status === 'canConnect') {
			}

			/**
			 * When a player is joins the lobby.
			 */
			if (data.status === 'connected') {
				//If playerList exceeds 1 -> Reset
				if (host && playerList.length == 2) {
					// playerList = [];
					// playerList.push(currentPlayer);
				} else {
					mqttClient.publish(
						topic,
						JSON.stringify({
							clientId: clientId,
							status: 'connectionRequest',
							player: currentPlayer
						})
					);
					console.log('Connection request from ' + data.clientId);

					//Set his offlinePlayer variable to false
					data.player.offlinePlayer = false;
					playerList.push(data.player);
					if (data.player.avatar !== undefined) {
						showPlayers(playerList);
					}
				}
			}

			/**
			 * When you join an existing lobby you'll get a message
			 * by other users telling you they are also in the lobby
			 */
			if (data.status === 'connectionRequest') {
				//Set game host to false as they are
				host = false;
				if (playerList.length > 1) {
					playerList = [];
					playerList.push(currentPlayer);
				}
				console.log('Connection request from ' + data.clientId);
				data.player.offlinePlayer = false;
				playerList.push(data.player);

				//If he already has an avatar -> show avatar
				if (data.player.avatar !== undefined) {
					showPlayers(playerList);
				}
			}
			/**
			 * When other user has chosen an avatar and is ready for the game to start
			 */
			if (data.status === 'finalisedConnection') {
				console.log('Finalised connection request from ' + data.clientId);
				playerList.forEach(el => {
					if (el.clientId === data.clientId) {
						el.avatar = data.avatar;
						el.status = 'connected';
						showPlayers(playerList);
					}
				});
				//Show new player in playerlist
			}
			/**
			 * When the other user clicks the start button
			 */
			if (data.status === 'startGameLobby') {
				console.log('Started Game');

				document.querySelector('.js-main__lobby').classList.add('u-hidden');

				let otherPlayer;
				playerList.forEach(p => {
					if (!p.offlinePlayer) otherPlayer = p;
				});
				initialiseNewGame(currentPlayer, otherPlayer, true);

				//Remove lobby from list
				currentLobby.status = 1;
			}

			/**
			 * When other user disconnects from the lobby
			 */
			if (data.status === 'disconnect') {
				playerList.pop(data.player);
				showPlayers(playerList);
			}
		}
	});

	getLobbies();
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
			else callback(null);
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

function exitLobbyHandler() {
	if (isFullscreen && document.fullscreenElement == null) {
		if (currentLobby !== undefined) {
			leaveLobby();
		}
		location.reload();
	}
}
