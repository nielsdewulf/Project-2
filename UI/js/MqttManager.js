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
	client.subscribe(mainId, function(err) {
		if (!err) {
			console.warn('Connected');
		} else {
			console.log(err);
		}
	});
});
