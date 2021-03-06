/**
 * Commands:
 * joinLobby(gameId)
 * leaveLobby()
 * loadGame() : start van spel
 * getTopHighscores(5) : 5 = bv top 5
 */
let keyboardOpen = false;

const showLeaderBoardPopup = () => {
	document.querySelector('.js-main__score-results').classList.remove('u-hidden');
};

const showNewLobbies = data => {
	/**
	 * data.gameId
	 * data.PlayerCount
	 * data.MenuId
	 * data.Status
	 */
	let parent = document.querySelector('.js-lobby-parent');
	let result = '';
	data.forEach(el => {
		let obj = `<div class="c-lobbychoice__item js-lobbychoice__item" game-id="${el.gameId}">
        <div class="c-lobbychoice__content">
            <h2 class="c-lobbychoice__title">Noordpool #${el.menuId}</h2>
            <div class="c-lobbychoice__players">
                <h2 class="c-lobbychoice__players-title">Spelers:</h2>
				<h2 class="c-lobbychoice__players-count">${el.playerCount} / 2</h2>
				<h2 class="c-lobbychoice__players-position">${getPositionNameById(el.modeId)}</h2>
            </div>
        </div>
    </div>`;
		result += obj;
	});
	parent.innerHTML = result;
	/* Lobby Choice Item Event Listener */
	document.querySelectorAll('.js-lobbychoice__item').forEach(el => {
		el.addEventListener('click', function() {
			console.log('Lobby clicked');
			if (joinLobby(el.getAttribute('game-id'))) {
				document.querySelector('.js-main__lobbychoice').classList.add('u-hidden');
				document.querySelector('.js-main__avatar-multiplayer').classList.remove('u-hidden');
			}
		});
	});
};
const showLeaderboard = data => {
	/**
	 * [{data.playerId
	 * data.name
	 * data.gameId
	 * data.score
	 * data.avatar},...]
	 */
	console.log(data);
	let parent = document.querySelector('.js-scoreboard-parent');
	let result = '';
	let count = 1;
	let avatarIcon;
	for (let player of data) {
		switch (player.avatar) {
			case 0:
				avatarIcon = './img/png/JelleyAvatarIcon.png';
				break;
			case 1:
				avatarIcon = './img/png/StokeleyAvatarIcon.png';
				break;
			case 2:
				avatarIcon = './img/png/SpikeyAvatarIcon.png';
				break;
			case 3:
				avatarIcon = './img/png/VlamAvatarIcon.png';
				break;
		}
		let obj = `<div class="c-vertical-grid__box">
        <h2 class="c-horizontal-grid__place c-horizontal-grid__text c-horizontal-grid--center">${count}e
        </h2>
        <img class="c-horizontal-grid__icon" src=${avatarIcon}>
        <h2 class="c-horizontal-grid__name c-horizontal-grid__text c-horizontal-grid--center">${player.name}</h2>
        <h2 class="c-horizontal-grid__score c-horizontal-grid__text c-horizontal-grid--center">${player.score}</h2>
        </div>`;
		count += 1;
		result += obj;
	}
	parent.innerHTML = result;
};
const showResults = data => {
	/**
	 * data.avatar
	 * data.score
	 */
	console.log(data);
	let parent = document.querySelector('.js-results-parent');
	let result = '';
	let count = 1;
	let avatarIcon;
	let avatarName;
	data.forEach(player => {
		switch (player.avatar) {
			case 0:
				avatarIcon = './img/png/JelleyAvatarIcon.png';
				avatarName = 'Jelley';
				break;
			case 1:
				avatarIcon = './img/png/StokeleyAvatarIcon.png';
				avatarName = 'Stokeley';
				break;
			case 2:
				avatarIcon = './img/png/SpikeyAvatarIcon.png';
				avatarName = 'Spikey';
				break;
			case 3:
				avatarIcon = './img/png/VlamAvatarIcon.png';
				avatarName = 'Vlam';
				break;
		}
		if (player.offlinePlayer) avatarName += ' (jij)';
		let obj = `<div class="c-vertical-grid__box">
        <h2 class="c-horizontal-grid__place c-horizontal-grid__text c-horizontal-grid--center">${count}e</h2>
        <img class="c-horizontal-grid__icon" src="${avatarIcon}">
        <h2 class="c-horizontal-grid__name c-horizontal-grid__text c-horizontal-grid--center">${avatarName}</h2>
        <h2 class="c-horizontal-grid__score c-horizontal-grid__text c-horizontal-grid--center">${player.score}</h2>
        </div>`;
		count += 1;
		result += obj;
	});
	parent.innerHTML = result;
};
const showPlayers = data => {
	/**
	 * data.clientId
	 * data.status
	 *      finalising: Moet nog avatar kiezen
	 *      connected: Klaar voor te spelen
	 * data.avatar
	 */
	let result = '';

	console.log(data);
	for (let player of data) {
		let avatarIcon;
		let avatarName;
		if (player.avatar !== undefined) {
			switch (player.avatar) {
				case 0:
					avatarIcon = './img/png/JelleyAvatarIcon.png';
					avatarName = 'Jelley';
					break;
				case 1:
					avatarIcon = './img/png/StokeleyAvatarIcon.png';
					avatarName = 'Stokeley';
					break;
				case 2:
					avatarIcon = './img/png/SpikeyAvatarIcon.png';
					avatarName = 'Spikey';
					break;
				case 3:
					avatarIcon = './img/png/VlamAvatarIcon.png';
					avatarName = 'Vlam';
					break;
			}
			if (player.offlinePlayer) avatarName += ' (jij)';

			result += `<div class="c-vertical-grid__box-lobby">
    <img src="${avatarIcon}" class="c-horizontal-grid__icon-lobby">
    <h2
        class="c-horizontal-grid__name-lobby c-horizontal-grid__text-lobby c-horizontal-grid--center-lobby">
        ${avatarName}</h2>
</div>`;
		}
	}
	let parent = document.querySelector('.js-multiplayer-lobby-grid');
	// console.log(result);
	parent.innerHTML = result;
};
const clearPlayerList = () => {
	document.querySelector('.js-multiplayer-lobby-grid').innerHTML = '';
};
const getPathById = id => {
	switch (id) {
		case 0:
			return './img/png/JelleyAvatarIcon.png';
		case 1:
			return './img/png/StokeleyAvatarIcon.png';
		case 2:
			return './img/png/SpikeyAvatarIcon.png';
		case 3:
			return './img/png/VlamAvatarIcon.png';
	}
};
const getPositionNameById = id => {
	switch (id) {
		case 0:
			return 'Plank';
		case 1:
			return 'Rechtstaand';
		case 2:
			return 'Squat';
	}
};
let buttonListeners = function() {
	document.querySelectorAll('.js-singleplayer-position').forEach(el => {
		el.addEventListener('click', el => {
			console.log(el.target.checked);
		});
	});

	/* Start Page Singleplayer Button Event Listener */
	let singlePlayerButton = document.querySelector('.js-button__singleplayer');
	singlePlayerButton.addEventListener('click', function() {
		console.log('Singleplayer button clicked');
		document.querySelector('.js-main__start').classList.add('u-hidden');
		document.querySelector('.js-main__position-singleplayer').classList.remove('u-hidden');
	});

	/* Singleplayer Avatar Choice Button Event Listener */
	let avatarSinglePlayerButton = document.querySelector('.js-button__avatar-singleplayer');
	avatarSinglePlayerButton.addEventListener('click', function() {
		console.log('Start game button clicked');
		document.querySelector('.js-main__avatar-singleplayer').classList.add('u-hidden');
		document.querySelectorAll('.js-singleplayer-avatar').forEach(el => {
			if (el.checked) {
				currentPlayer.avatar = parseInt(el.value);
				document.querySelector('.js-game__loader-avatar').style.backgroundImage = `url('${getPathById(parseInt(el.value))}')`;
				initialiseNewGame(currentPlayer);
			}
		});
	});

	/* Singleplayerposition Avatar Button Event Listener */
	let positionSinglePlayerAvatarButton = document.querySelector('.js-button__avatar-singleplayerposition');
	positionSinglePlayerAvatarButton.addEventListener('click', function() {
		console.log('Next button clicked');
		document.querySelector('.js-main__position-singleplayer').classList.add('u-hidden');
		document.querySelector('.js-main__avatar-singleplayer').classList.remove('u-hidden');
		//Save position
		document.querySelectorAll('.js-singleplayer-position').forEach(el => {
			if (el.checked) {
				modus = modi[parseInt(el.value)];
			}
		});
	});

	/* Positionchoice Singleplayer Startpage Button Event Listener */
	let positionSinglePlayerStartpageButton = document.querySelector('.js-button__singleplayerpositionchoice-startpage');
	positionSinglePlayerStartpageButton.addEventListener('click', function() {
		console.log('Startpage button clicked');
		document.querySelector('.js-main__position-singleplayer').classList.add('u-hidden');
		document.querySelector('.js-main__start').classList.remove('u-hidden');
	});

	/* Singleplayer Startpage Button Event Listener */
	let avatarsinglePlayerStartpageButton = document.querySelector('.js-button__avatar-startpage');
	avatarsinglePlayerStartpageButton.addEventListener('click', function() {
		console.log('Startpage button clicked');
		document.querySelector('.js-main__avatar-singleplayer').classList.add('u-hidden');
		document.querySelector('.js-main__start').classList.remove('u-hidden');
	});

	/* Start Page Multiplayer Button Event Listener */
	let multiPlayerButton = document.querySelector('.js-button__multiplayer');
	multiPlayerButton.addEventListener('click', function() {
		console.log('Multiplayer button clicked');
		document.querySelector('.js-main__start').classList.add('u-hidden');
		// document.querySelector('.js-main__position-multiplayer').classList.remove('u-hidden');
		document.querySelector('.js-main__lobbychoice').classList.remove('u-hidden');
	});

	/* Multiplayer Avatar Choice Button Event Listener */
	let avatarMultiPlayerButton = document.querySelector('.js-button__avatar-multiplayer');
	avatarMultiPlayerButton.addEventListener('click', function() {
		console.log('Multiplayer avatar button clicked');
		document.querySelector('.js-main__avatar-multiplayer').classList.add('u-hidden');
		document.querySelector('.js-main__lobby').classList.remove('u-hidden');
		document.querySelectorAll('.js-multiplayer-avatar').forEach(el => {
			if (el.checked) {
				console.log(el.value);
				document.querySelector('.js-game__loader-avatar').style.backgroundImage = `url('${getPathById(parseInt(el.value))}')`;
				finaliseConnection(parseInt(el.value));
			}
		});
	});

	/* Multiplayerposition Avatar Button Event Listener */
	let positionMultiPlayerAvatarButton = document.querySelector('.js-button__avatar-multiplayerposition');
	positionMultiPlayerAvatarButton.addEventListener('click', function() {
		console.log('Next button clicked');
		document.querySelector('.js-main__position-multiplayer').classList.add('u-hidden');
		document.querySelector('.js-main__avatar-multiplayer').classList.remove('u-hidden');
		//Create new lobby with selected mode

		document.querySelectorAll('.js-multiplayer-position').forEach(el => {
			if (el.checked) {
				modus = modi[parseInt(el.value)];
				createNewLobby();
			}
		});
	});

	/* Positionchoice Multiplayer Startpage Button Event Listener */
	let positionchoiceMultiPlayerStartpageButton = document.querySelector('.js-button__multiplayerpositionchoice-startpage');
	positionchoiceMultiPlayerStartpageButton.addEventListener('click', function() {
		console.log('Startpage button clicked');
		document.querySelector('.js-main__position-multiplayer').classList.add('u-hidden');
		document.querySelector('.js-main__start').classList.remove('u-hidden');
	});

	/* Start Page Scoreboard Button Event Listener */

	let scoreboardButtonStartpage = document.querySelector('.js-button__scoreboard-startpage');
	scoreboardButtonStartpage.addEventListener('click', function() {
		console.log('Singleplayer button clicked');
		document.querySelector('.js-main__start').classList.add('u-hidden');
		document.querySelector('.js-main__scoreboard').classList.remove('u-hidden');
	});

	/** New Lobby Button Event Listener*/

	let lobbyAddButton = document.querySelector('.js-new-lobby');
	lobbyAddButton.addEventListener('click', function() {
		console.log('New Lobby button clicked');
		document.querySelector('.js-main__lobbychoice').classList.add('u-hidden');
		document.querySelector('.js-main__position-multiplayer').classList.remove('u-hidden');
		// createNewLobby();
	});
	/* Start Game Lobby Button Event Listener */
	let lobbyStartGameButton = document.querySelector('.js-button__lobby-startgame');
	lobbyStartGameButton.addEventListener('click', function() {
		console.log('Start game button clicked');
		if (loadGame()) {
			document.querySelector('.js-main__lobby').classList.add('u-hidden');
		}
	});

	/* Scoreboard Lobby Choice Button Event Listener */
	let scoreboardButtonLobbyChoice = document.querySelector('.js-button__scoreboard-lobbychoice');
	scoreboardButtonLobbyChoice.addEventListener('click', function() {
		console.log('Scoreboard Button Clicked');
		document.querySelector('.js-main__lobbychoice').classList.add('u-hidden');
		document.querySelector('.js-main__scoreboard').classList.remove('u-hidden');
	});

	/* Startpage Scoreboard Button Event Listener */
	let startpageButtonScoreboard = document.querySelector('.js-button__startpage-scoreboard');
	startpageButtonScoreboard.addEventListener('click', function() {
		console.log('Scoreboard Button Clicked');
		document.querySelector('.js-main__scoreboard').classList.add('u-hidden');
		document.querySelector('.js-main__start').classList.remove('u-hidden');
	});

	/* Startpage Lobby Button Event Listener */
	let startpageButtonLobby = document.querySelector('.js-button__lobbychoice-startpage');
	startpageButtonLobby.addEventListener('click', function() {
		console.log('Startpage Button Clicked');
		document.querySelector('.js-main__lobbychoice').classList.add('u-hidden');
		document.querySelector('.js-main__start').classList.remove('u-hidden');
	});

	/* Startpage Lobby Button Event Listener */
	let lobbyStartpageButton = document.querySelector('.js-button__lobby-lobbychoice');
	lobbyStartpageButton.addEventListener('click', function() {
		console.log('Lobbychoice Button Clicked');
		document.querySelector('.js-main__lobby').classList.add('u-hidden');
		document.querySelector('.js-main__lobbychoice').classList.remove('u-hidden');
		leaveLobby();
	});

	/* Scoreboard Resultaten Button Event Listener */
	let scoreboardResultsButton = document.querySelector('.js-button__scoreboard-results');
	scoreboardResultsButton.addEventListener('click', function() {
		console.log('Startpage Button Clicked');
		document.querySelector('.js-main__results').classList.add('u-hidden');
		document.querySelector('.js-main__scoreboard').classList.remove('u-hidden');
	});

	/* Start page Resultaten Button Event Listener */
	let startpageResultsButton = document.querySelector('.js-button__start-results');
	startpageResultsButton.addEventListener('click', function() {
		console.log('Startpage Button Clicked');
		document.querySelector('.js-main__results').classList.add('u-hidden');
		document.querySelector('.js-main__start').classList.remove('u-hidden');
	});

	/* Resultaten Popup Skip Button Event Listener */
	let resultsSkipPopUpButton = document.querySelector('.js-button__scoreboard-popup-skip');
	resultsSkipPopUpButton.addEventListener('click', function() {
		console.log('Results Skip Button Clicked');
		try {
			document.querySelector('.js-scoreboard-popup__input').blur();
		} finally {
			document.querySelector('.js-main__score-results').classList.add('u-hidden');
			document.querySelector('.js-scoreboard-popup__input').value = '';
		}
	});
	/* Resultaten Popup Button Event Listener */
	let resultsPopUpButton = document.querySelector('.js-button__score-results');
	resultsPopUpButton.addEventListener('click', function() {
		console.log('Results Save Button Clicked');
		try {
			document.querySelector('.js-scoreboard-popup__input').blur();
		} finally {
			document.querySelector('.js-main__score-results').classList.add('u-hidden');
		}
		let val = document
			.querySelector('.js-scoreboard-popup__input')
			.value.toString()
			.trim();
		if (!(val === null || val.match(/^ *$/) !== null)) {
			saveHighscore(val, score, lobbyId, currentPlayer.avatar);
			document.querySelector('.js-scoreboard-popup__input').value = '';
		}
	});

	document.querySelector('.js-scoreboard-popup__input').addEventListener('focusin', () => {
		let iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
		if (!iOS) {
			document.querySelector('.js-scoreboard-popup').classList.add('js-scoreboard-popup--open');
		}
	});
	document.querySelector('.js-scoreboard-popup__input').addEventListener('focusout', () => {
		let iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
		if (!iOS) {
			document.querySelector('.js-scoreboard-popup').classList.remove('js-scoreboard-popup--open');
		}
	});
};

const initFrontend = () => {};

document.addEventListener('DOMContentLoaded', function() {
	console.log('DOM Content Loaded');
	buttonListeners();
	initFrontend();
});
