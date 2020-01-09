let buttonListeners = function () {
    /* Start Page Singleplayer Button Event Listener */
    let singlePlayerButton = document.querySelector('.js-button__singleplayer');
    singlePlayerButton.addEventListener('click', function () {
        console.log('Singleplayer button clicked');
        document.querySelector('.js-main__start').classList.add('c-hidden');
        document.querySelector('.js-main__avatar-singleplayer').classList.remove('c-hidden');
    })

    /* Singleplayer Avatar Choice Button Event Listener */
    let avatarSinglePlayerButton = document.querySelector('.js-button__avatar-singleplayer');
    avatarSinglePlayerButton.addEventListener('click', function () {
        console.log('Start game button clicked');
        document.querySelector('.js-main__avatar-singleplayer').classList.add('c-hidden');
    })

    /* Start Page Multiplayer Button Event Listener */
    let multiPlayerButton = document.querySelector('.js-button__multiplayer');
    multiPlayerButton.addEventListener('click', function () {
        console.log('Multiplayer button clicked');
        document.querySelector('.js-main__start').classList.add('c-hidden');
        document.querySelector('.js-main__lobbychoice').classList.remove('c-hidden');
    })

    /* Lobby Choice Item Event Listener */
    document.querySelectorAll('.js-lobbychoice__item').forEach(el => {
        el.addEventListener('click', function () {
            console.log('Lobby clicked');
            document.querySelector('.js-main__lobbychoice').classList.add('c-hidden');
            document.querySelector('.js-main__avatar-multiplayer').classList.remove('c-hidden');
            //JoinLobby(el.getAttribute('game-id'))
        })
    });


    /* Multiplayer Avatar Choice Button Event Listener */
    let avatarMultiPlayerButton = document.querySelector('.js-button__avatar-multiplayer');
    avatarMultiPlayerButton.addEventListener('click', function () {
        console.log('Multiplayer avatar button clicked');
        document.querySelector('.js-main__avatar-multiplayer').classList.add('c-hidden');
        document.querySelector('.js-main__lobby').classList.remove('c-hidden');
    })

    /* Start Game Lobby Button Event Listener */
    let lobbyStartGameButton = document.querySelector('.js-button__lobby-startgame');
    lobbyStartGameButton.addEventListener('click', function () {
        console.log('Start game button clicked');
        document.querySelector('.js-main__lobby').classList.add('c-hidden');
    })

    /* Scoreboard Lobby Choice Button Event Listener */
    let scoreboardButtonLobbyChoice = document.querySelector('.js-button__scoreboard-lobbychoice');
    scoreboardButtonLobbyChoice.addEventListener('click', function () {
        console.log('Scoreboard Button Clicked');
        document.querySelector('.js-main__lobbychoice').classList.add('c-hidden');
        document.querySelector('.js-main__scoreboard').classList.remove('c-hidden');
    })

    /* Startpage Scoreboard Button Event Listener */
    let startpageButtonScoreboard = document.querySelector('.js-button__startpage-scoreboard');
    startpageButtonScoreboard.addEventListener('click', function () {
        console.log('Scoreboard Button Clicked');
        document.querySelector('.js-main__scoreboard').classList.add('c-hidden');
        document.querySelector('.js-main__start').classList.remove('c-hidden');
    })

    /* Scoreboard Resultaten Button Event Listener */
    let scoreboardResultsButton = document.querySelector('js-button__scoreboard-results');
    scoreboardResultsButton.addEventListener('click', function () {
        console.log('Startpage Button Clicked');
        document.querySelector('.js-main__results').classList.add('c-hidden');
        document.querySelector('.js-main__start').classList.remove('c-hidden');
    })

    /* Start page Resultaten Button Event Listener */
    let startpageResultsButton = document.querySelector('js-button__start-results');
    startpageResultsButton.addEventListener('click', function () {
        console.log('Startpage Button Clicked');
        document.querySelector('.js-main__results').classList.add('c-hidden');
        document.querySelector('.js-main__scoreboard').classList.remove('c-hidden');
    })

    /* Resultaten Popup Button Event Listener */
    let resultsPopUpButton = document.querySelector('.js-button__score-results');
    resultsPopUpButton.addEventListener('click', function () {
        console.log('Results Button Clicked');
        document.querySelector('.js-main__score-popup').classList.add('c-hidden');
    })

}




document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Content Loaded')

    buttonListeners();
})