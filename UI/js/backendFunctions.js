/**
 * Make sure MQTT Manager is loaded before this
 */
const showNewLobby = (data) => {
    /**
     * data.lobbyId
     * data.playerCount
     * data.menuId
     * data.lobbyStatus
     */
};


const createNewLobby = () => {
    /**
     * data.lobbyId
     * data.playerCount
     * data.menuId
     * data.lobbyStatus
     */
    let message = {
        PlayerCount:1,
        Status:0,
    }
};

const init = () => {};

document.addEventListener('DOMContentLoaded', function() {
	init();
	mqttClient.on('message', function(topic, message) {
		if (topic === mainId) {
			let data = JSON.parse(message);
		}
	});
});

const handleData = function(url, callback, method = 'GET', body = null) {
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
