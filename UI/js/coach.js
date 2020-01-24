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

const clearLeaderboard = () => {
	handleData(BASE_URL + `scores/clear`, () => {
		mqttClient.publish(
			mainId,
			JSON.stringify({
				clientId: clientId,
				status: 'newHighscore'
			})
		);
		alert('Successfully cleared leaderboard');
	});
};
const init = () => {
	document.querySelector('.js-button__clear-leaderboard').addEventListener('click', () => {
		clearLeaderboard();
	});
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
			else callback(null);
		});
};
