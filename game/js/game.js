var clientId = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));

var width, height;

var boundingWidth, boundingHeight;

var screenangle = window.orientation;

var gyroscope = true;
var noSleep = new NoSleep();

var client;

var multiplayer = false;
var host = true;
var connectedCloud = false;

var started = false;
var platforms;

var player;
var beforePlayerData = {
	clientId: clientId,
	isRunning: false,
	direction: 0
};
var otherPlayer;
var otherPlayerData = {
	isRunning: false,
	direction: 0,
	isJumping: false,
	x: 0,
	y: 0
};

var icicleConfig = {
	minSpawnOffset: 1.15,
	maxSpawnOffset: 0.85
};

var alive = true;
var currentScene;

var penguinsLEFT = [];
var penguinsRIGHT = [];

var enemies = [];
var lastTimeSpawn = new Date().getTime();

let scoreText;
let enemiesText;
let score = 0;
let enemiesSpawned = 0;

/**
 * Game life cycles
 */

function preload() {
	this.load.image('bg', 'assets/bg.png');
	this.load.image('platform', 'assets/PlatformAfloatCenter.png');
	this.load.image('platform-edge-left', 'assets/PlatformAfloatLeft.png');
	this.load.image('platform-edge-right', 'assets/PlatformAfloatRight.png');
	this.load.image('platform-full', 'assets/PlatformAfloatFullHigher.png');

	// this.load.image('platform', 'assets/.png');

	this.load.image('player', 'assets/player.png');
	this.load.image('penguin', 'assets/PenguinAfloat.png');
	this.load.image('icicle', 'assets/IcicleAfloat.png');
}

function create() {
	currentScene = this;

	enemies = [];
	penguinsLEFT = [];
	penguinsRIGHT = [];
	[width, height] = calcWidthHeight();

	[boundingWidth, boundingHeight] = calcGameBounds(height);

	/**
	 * Resize listeners
	 */
	window.removeEventListener('resize', resize);
	window.addEventListener('resize', resize);

	this.scale.setGameSize(width, height);

	/**
	 * Background
	 */
	let bg = this.add.tileSprite(width / 2, height - height / 2, width, height, 'bg');
	// bg.displayWidth = width < height ? width : height;

	bg.tileScaleX = bg.tileScaleY = width / 7500;

	// bg.alpha = 0.5;

	/**
	 * World events
	 */
	//   this.physics.world.on('worldbounds', addScore);
	//   this.physics.world.setBoundsCollision(true, true, false, true);

	/**
	 * Platform
	 */
	platforms = this.physics.add.staticGroup();

	// platform = this.add.rectangle((width - boundingWidth * 0.55) / 2 + boundingWidth * 0.55, height - height * 0.1, (boundingWidth / 1344) * 192, (boundingWidth / 1344) * 192, 0xff0000);
	// // platforms.add(platform);
	// platform.setOrigin(0, 0);
	// platform.setDepth(1000);
	// var container = this.add.container(width / 2, height - height * 0.05);

	/**
	 * Left platform edge
	 */

	// let sprite = this.add.tileSprite((width - boundingWidth * 0.55) / 2+1, height - height * 0.1, (boundingWidth / 1344) * 30, (boundingWidth / 1344) * 96, 'platform-edge-left');
	// // sprite.displayWidth = (boundingWidth / 1344) * 192;
	// sprite.tileScaleX = sprite.tileScaleY = boundingWidth / 4400;
	// // ts.tileScaleY = boundingWidth / 1354;
	// sprite.setOrigin(1, 0);
	// // spritexd.displayHeight = boundingHeight * 0.1;

	// // spritexd.scaleY = spritexd.scaleX = boundingWidth / 1344;
	// platforms.add(sprite);

	/**
	 * Right platform edge
	 */
	// let spritexd = this.add.tileSprite((width - boundingWidth * 0.55) / 2 + boundingWidth * 0.55 - 0.5, height - height * 0.1, (boundingWidth / 1344) * 30, (boundingWidth / 1344) * 192, 'platform-edge-right');
	// // sprite.displayWidth = (boundingWidth / 1344) * 192;
	// spritexd.tileScaleX = spritexd.tileScaleY = boundingWidth / 4400;
	// // ts.tileScaleY = boundingWidth / 1354;
	// spritexd.setOrigin(0, 0);
	// // spritexd.displayHeight = boundingHeight * 0.1;

	// // spritexd.scaleY = spritexd.scaleX = boundingWidth / 1344;
	// platforms.add(spritexd);

	// var shape = this.make.graphics();

	// shape.fillStyle(0xffffff);

	// shape.beginPath();

	// shape.fillRect((width - boundingWidth * 0.55) / 2 + boundingWidth * 0.55, height - height * 0.1, (boundingWidth / 1344) * 192, (boundingWidth / 1344) * 192);
	// // shape.setOrigin(0, 0);
	// var mask = shape.createGeometryMask();

	// spritexd.setMask(mask);

	/**
	 * Middle platform
	 */
	ts = this.add.tileSprite(width / 2, height - height * 0.1, boundingWidth * 0.85, (boundingWidth / 1344) * 96, 'platform-full');
	ts.tilePositionX = 0;
	ts.tilePositionY = 0;
	ts.setOrigin(0.5, 0);

	ts.tileScaleX = boundingWidth / 3540;
	ts.tileScaleY = boundingWidth / 3540;
	platforms.add(ts);

	/**
	 * Player
	 */
	player = this.physics.add.sprite(width / 2, height - height * 0.5, 'player');
	// player.displayWidth = ;
	player.scaleY = player.scaleX = boundingWidth / 1400;

	this.physics.add.existing(player);
	player.setDepth(10);
	player.body.bounce.x = 0.2;
	player.body.bounce.y = 0.2;

	player.body.setCollideWorldBounds = true;
	this.physics.add.collider(player, platforms);

	cursors = this.input.keyboard.createCursorKeys();

	// /**
	//  * Sliding object
	//  */

	// let penguin = this.physics.add.sprite((width - boundingWidth * 0.85) / 2, height - height * 0.2, 'player');
	// penguin.scaleY = penguin.scaleX = boundingWidth / 3000;

	// this.physics.add.existing(penguin);
	// penguin.setDepth(10);
	// penguin.body.bounce.x = 0.2;
	// penguin.body.bounce.y = 0.2;
	// penguin.body.setCollideWorldBounds = true;
	// this.physics.add.collider(penguin, platforms);
	// enemies.push(penguin);
	// penguinsRIGHT.push(penguin);
	// /**
	//  * Falling object
	//  */
	// let x = Math.random() * ((width - boundingWidth * 0.85) / 2 + boundingWidth * 0.85 - (width - boundingWidth * 0.85) / 2) + (width - boundingWidth * 0.85) / 2;
	// console.warn('REEEEEE: ' + x);
	// ice = this.physics.add.sprite(((width - boundingWidth * 0.85) / 2 + boundingWidth * 0.85) * icicleConfig.maxSpawnOffset, 0, 'player');
	// ice.scaleY = ice.scaleX = boundingWidth / 3000;

	// this.physics.add.existing(ice);
	// ice.setDepth(10);
	// ice.body.bounce.x = 0.2;
	// ice.body.bounce.y = 0.2;
	// // ice.body.setCollideWorldBounds = true;
	// // this.physics.add.collider(ice, platforms);
	// enemies.push(ice);

	// this.physics.add.overlap(player, enemies, die, null, this);

	/**
	 * Click event
	 */
	this.input.on(
		'pointerup',
		function(pointer) {
			// if (this.scale.isFullscreen) {
			// 	this.scale.stopFullscreen();
			// 	noSleep.disable();
			// 	// On stop fulll screen
			// } else {
			// 	this.scale.startFullscreen();
			// 	noSleep.enable();
			// 	// On start fulll screen
			// }
			// screen.orientation.lock('landscape-primary');
			if (player.body.touching.down) {
				player.body.velocity.y = ((player.height + boundingHeight) / 2) * 1.2 * -1;

				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isJumping: true
					};
					if (beforePlayerData.isJumping !== newPlayerData.isJumping) {
						let [x, y] = getNormalizedPositions(player.body.x, player.body.y);

						client.publish(
							'aaa',
							JSON.stringify({
								clientId: clientId,
								isJumping: true,
								status: 'movement',
								x: x,
								y: y
							})
						);
						beforePlayerData = newPlayerData;
					}
				}
			}
		},
		this
	);

	/**
	 * Score
	 */
	scoreText = this.add.text(width / 2, 0, 'Test', {
		font: '65px Arial',
		fill: '#ffffff',
		align: 'center'
	});
	//   enemiesText = this.add.text(width / 4, 0, 'Test', {
	//     font: '65px Arial',
	//     fill: '#ffffff',
	//     align: 'center'
	//   });

	/**
	 * Initialise MQTT
	 */
	initMqtt(this);
	/**
	 * Gyroscope
	 */

	let text = this.add.text(0, 0, 'Test', {
		font: '65px Arial',
		fill: '#ff0044',
		align: 'center'
	});
	var gn = new GyroNorm();
	gn.init()
		.then(function() {
			gn.start(function(data) {
				if (window.orientation === -90) {
					if (data.do.beta > 6) {
						player.body.velocity.x = boundingWidth * -0.3;
						if (connectedCloud) {
							let newPlayerData = {
								clientId: clientId,
								isRunning: true,
								direction: -1
							};
							if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
								let [x, y] = getNormalizedPositions(player.body.x, player.body.y);
								client.publish(
									'aaa',
									JSON.stringify({
										clientId: clientId,
										isRunning: true,
										direction: -1,
										status: 'movement',

										x: x,
										y: y
									})
								);
								beforePlayerData = newPlayerData;
							}
						}
					} else if (data.do.beta < -6) {
						player.body.velocity.x = boundingWidth * 0.3;
						if (connectedCloud) {
							let newPlayerData = {
								clientId: clientId,
								isRunning: true,
								direction: 1
							};
							if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
								let [x, y] = getNormalizedPositions(player.body.x, player.body.y);

								client.publish(
									'aaa',
									JSON.stringify({
										clientId: clientId,
										isRunning: true,
										direction: 1,
										status: 'movement',

										x: x,
										y: y
									})
								);
								beforePlayerData = newPlayerData;
							}
						}
					} else {
						player.body.velocity.x = 0;
						if (connectedCloud) {
							let newPlayerData = {
								clientId: clientId,
								isRunning: false,
								direction: 0
							};
							if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
								let [x, y] = getNormalizedPositions(player.body.x, player.body.y);

								client.publish(
									'aaa',
									JSON.stringify({
										clientId: clientId,
										isRunning: false,
										direction: 0,
										status: 'movement',

										x: x,
										y: y
									})
								);
								beforePlayerData = newPlayerData;
							}
						}
					}
					text.setText(data.do.beta);
				} else if (window.orientation === 90) {
					if (data.do.beta > 6) {
						player.body.velocity.x = boundingWidth * 0.3;
						if (connectedCloud) {
							let newPlayerData = {
								clientId: clientId,
								isRunning: true,
								direction: 1
							};
							if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
								let [x, y] = getNormalizedPositions(player.body.x, player.body.y);

								client.publish(
									'aaa',
									JSON.stringify({
										clientId: clientId,
										isRunning: true,
										direction: 1,
										status: 'movement',

										x: x,
										y: y
									})
								);
								beforePlayerData = newPlayerData;
							}
						}
					} else if (data.do.beta < -6) {
						player.body.velocity.x = boundingWidth * -0.3;
						if (connectedCloud) {
							let newPlayerData = {
								clientId: clientId,
								isRunning: true,
								direction: -1
							};
							if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
								let [x, y] = getNormalizedPositions(player.body.x, player.body.y);

								client.publish(
									'aaa',
									JSON.stringify({
										clientId: clientId,
										isRunning: true,
										direction: -1,
										status: 'movement',

										x: x,
										y: y
									})
								);
								beforePlayerData = newPlayerData;
							}
						}
					} else {
						player.body.velocity.x = 0;
						if (connectedCloud) {
							let newPlayerData = {
								clientId: clientId,
								isRunning: false,
								direction: 0
							};
							if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
								let [x, y] = getNormalizedPositions(player.body.x, player.body.y);

								client.publish(
									'aaa',
									JSON.stringify({
										clientId: clientId,
										isRunning: false,
										direction: 0,
										status: 'movement',

										x: x,
										y: y
									})
								);
								beforePlayerData = newPlayerData;
							}
						}
					}
					text.setText(data.do.beta);
				} else {
					if (data.do.gamma > 6) {
						player.body.velocity.x = boundingWidth * 0.3;
						if (connectedCloud) {
							let newPlayerData = {
								clientId: clientId,
								isRunning: true,
								direction: 1
							};
							if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
								let [x, y] = getNormalizedPositions(player.body.x, player.body.y);

								client.publish(
									'aaa',
									JSON.stringify({
										clientId: clientId,
										isRunning: true,
										direction: 1,
										status: 'movement',

										x: x,
										y: y
									})
								);
								beforePlayerData = newPlayerData;
							}
						}
					} else if (data.do.gamma < -6) {
						player.body.velocity.x = boundingWidth * -0.3;
						if (connectedCloud) {
							let newPlayerData = {
								clientId: clientId,
								isRunning: true,
								direction: -1
							};
							if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
								let [x, y] = getNormalizedPositions(player.body.x, player.body.y);
								client.publish(
									'aaa',
									JSON.stringify({
										clientId: clientId,
										isRunning: true,
										direction: -1,
										status: 'movement',

										x: x,
										y: y
									})
								);
								beforePlayerData = newPlayerData;
							}
						}
					} else {
						player.body.velocity.x = 0;
						if (connectedCloud) {
							let newPlayerData = {
								clientId: clientId,
								isRunning: false,
								direction: 0
							};
							if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
								let [x, y] = getNormalizedPositions(player.body.x, player.body.y);
								client.publish(
									'aaa',
									JSON.stringify({
										clientId: clientId,
										isRunning: false,
										direction: 0,
										status: 'movement',

										x: x,
										y: y
									})
								);
								beforePlayerData = newPlayerData;
							}
						}
					}
					text.setText(data.do.gamma);
				}
			});
		})
		.catch(function(e) {
			gyroscope = false;
			// Catch if the DeviceOrientation or DeviceMotion is not supported by the browser or device
		}); // start gyroscope detection
}

function update() {
	//   enemies.forEach((el, i) => {
	//       if (el.body.y > height) {
	//         console.log('enemy passed');
	//         enemies.pop(el);
	//         if (!enemies.includes(el)) {
	//           if (penguinsRIGHT.includes(el)) penguinsRIGHT.pop(el);
	//           if (penguinsLEFT.includes(el)) penguinsLEFT.pop(el);
	//           el.destroy();
	//         }
	//         score++;
	//       }

	//   });
	if (started) {
		penguinsLEFT.forEach((el, i) => {
			el.body.velocity.x = boundingWidth * 0.2 * -1;
		});
		penguinsRIGHT.forEach((el, i) => {
			el.body.velocity.x = boundingWidth * 0.2;
		});
	}
	/**
	 * START DEBUG
	 */
	if (!gyroscope) {
		if (cursors.left.isDown && !cursors.right.isDown) {
			player.body.velocity.x = boundingWidth * -0.3;

			if (connectedCloud) {
				let newPlayerData = {
					clientId: clientId,
					isRunning: true,
					direction: -1
				};
				if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
					let [x, y] = getNormalizedPositions(player.body.x, player.body.y);
					client.publish(
						'aaa',
						JSON.stringify({
							clientId: clientId,
							isRunning: true,
							direction: -1,
							status: 'movement',

							x: x,
							y: y
						})
					);
					beforePlayerData = newPlayerData;
				}
			}

			// player.anims.play('left', true);
		} else if (cursors.right.isDown) {
			player.body.velocity.x = boundingWidth * 0.3;
			if (connectedCloud) {
				let newPlayerData = {
					clientId: clientId,
					isRunning: true,
					direction: 1
				};
				if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
					let [x, y] = getNormalizedPositions(player.body.x, player.body.y);
					client.publish(
						'aaa',
						JSON.stringify({
							clientId: clientId,
							isRunning: true,
							direction: 1,
							status: 'movement',

							x: x,
							y: y
						})
					);
					beforePlayerData = newPlayerData;
				}
			}

			// player.anims.play('right', true);
		} else {
			player.body.velocity.x = 0;

			if (connectedCloud) {
				let newPlayerData = {
					clientId: clientId,
					isRunning: false,
					direction: 0
				};
				if (beforePlayerData.isRunning !== newPlayerData.isRunning) {
					let [x, y] = getNormalizedPositions(player.body.x, player.body.y);
					client.publish(
						'aaa',
						JSON.stringify({
							clientId: clientId,
							isRunning: false,
							direction: 0,
							status: 'movement',

							x: x,
							y: y
						})
					);
					beforePlayerData = newPlayerData;
				}
			}
			// player.anims.play('turn');
		}
		if (cursors.up.isDown && player.body.touching.down) {
			player.body.velocity.y = ((player.height + boundingHeight) / 2) * 1.2 * -1;

			if (connectedCloud) {
				let newPlayerData = {
					clientId: clientId,
					isJumping: true
				};
				if (beforePlayerData.isJumping !== newPlayerData.isJumping) {
					let [x, y] = getNormalizedPositions(player.body.x, player.body.y);
					client.publish(
						'aaa',
						JSON.stringify({
							clientId: clientId,
							isJumping: true,
							status: 'movement',

							x: x,
							y: y
						})
					);
					beforePlayerData = newPlayerData;
				}
			}
		}
	}

	/**
	 * END DEBUG
	 */

	if ((host || !multiplayer) && started) {
		let random = Math.random() * (8000 - 15000) + 8000;
		if (new Date().getTime() - lastTimeSpawn > random) {
			// console.log(new Date().getTime() - lastTimeSpawn, random);
			if (Math.random() > 0.2) {
				// console.warn('RESPAWNING');
				if (Math.random() <= 0.8) {
					/**
					 * Spawn icicle
					 */
					// console.error(width - (boundingWidth * 0.55) / 2, width - boundingWidth * 0.85 + boundingWidth);
					let x =
						Math.random() *
							(((width - boundingWidth * 0.85) / 2 + boundingWidth * 0.85) * icicleConfig.maxSpawnOffset - ((width - boundingWidth * 0.85) / 2) * icicleConfig.minSpawnOffset) +
						((width - boundingWidth * 0.85) / 2) * icicleConfig.minSpawnOffset;

					ice = this.physics.add.sprite(x, -1 * (boundingHeight * 0.4), 'icicle');
					ice.scaleY = ice.scaleX = boundingWidth / 6000;

					this.physics.add.existing(ice);
					ice.setDepth(1000);
					ice.setOrigin(0.5, 0);
					ice.body.bounce.x = 0.2;
					ice.body.bounce.y = 0.2;
					// ice.body.velocity.y = 500;

					// ice.body.setCollideWorldBounds(true);
					ice.body.onWorldBounds = true;

					// this.physics.add.collider(ice, platforms);
					enemies.push(ice);
					enemiesSpawned++;

					let [xb, yb] = getNormalizedPositions(x, -1 * (boundingHeight * 0.4));
					client.publish(
						'aaa',
						JSON.stringify({
							clientId: clientId,
							status: 'newEnemy',
							type: 'icicle',
							x: xb,
							y: yb
						})
					);
				} else {
					/**
					 * Spawn penguin
					 */
					let x;
					let list;
					let flip = true;

					//Randomize left/right
					if (Math.random() <= 0.5) {
						x = (width - boundingWidth * 0.85) / 2 + boundingWidth * 0.85;
						list = penguinsLEFT;
						flip = false;
					} else {
						x = (width - boundingWidth * 0.85) / 2;
						list = penguinsRIGHT;
					}

					let penguin = this.physics.add.sprite(x, height - height * 0.2, 'penguin');

					penguin.scaleY = penguin.scaleX = boundingWidth / 15000;
					penguin.flipX = flip;
					penguin.setOrigin(0.5, 0);

					this.physics.add.existing(penguin);
					penguin.setDepth(1000);
					penguin.body.bounce.x = 0.5;
					penguin.body.bounce.y = 0.5;

					// penguin.body.setCollideWorldBounds(true);
					penguin.body.onWorldBounds = true;

					this.physics.add.collider(penguin, platforms);
					enemies.push(penguin);
					list.push(penguin);
					enemiesSpawned++;
					let [xb, yb] = getNormalizedPositions(x, height - height * 0.2);
					client.publish(
						'aaa',
						JSON.stringify({
							clientId: clientId,
							status: 'newEnemy',
							type: 'penguin',
							flip: flip,
							x: xb,
							y: yb
						})
					);
				}
			}
			lastTimeSpawn = new Date().getTime();
		}
	}
	//   enemiesText.setText(enemiesSpawned);
	scoreText.setText(enemiesSpawned);

	if (otherPlayer != undefined) {
		if (otherPlayerData.isRunning && otherPlayerData.direction == -1) {
			otherPlayer.body.velocity.x = boundingWidth * -0.3;
			// console.log('Running left');
		} else if (otherPlayerData.isRunning && otherPlayerData.direction == 1) {
			otherPlayer.body.velocity.x = boundingWidth * 0.3;
			// console.log('Running right');
		} else {
			otherPlayer.body.velocity.x = 0;
			// console.log('Standstill');
		}
		if (otherPlayerData.isJumping && otherPlayer.body.touching.down) {
			otherPlayer.body.velocity.y = ((player.height + boundingHeight) / 2) * 1.2 * -1; //((player.height + boundingHeight) / 2) * 1.2 * -1
			otherPlayerData.isJumping = false;
			// console.log('Jumping');
		}
	}
}

/**
 * Game Utility functions
 */
function addScore(enemy) {
	if (enemy.y < height) return;
	console.log('enemy passed');
	enemies.pop(enemy);
	score++;
	if (!enemies.includes(enemy)) enemy.destroy();
	if (penguinsRIGHT.includes(enemy)) penguinsRIGHT.pop(enemy);
	if (penguinsLEFT.includes(enemy)) penguinsLEFT.pop(enemy);
}

function initMqtt(gameObj) {
	client = mqtt.connect(`ws://mct-mqtt.westeurope.cloudapp.azure.com`, {
		//wss://mqtt.funergydev.com:9001
		//51.105.206.206
		protocolId: 'MQTT'
	});
	client.on('connect', function() {
		client.subscribe('aaa', function(err) {
			if (!err) {
				connectedCloud = true;
				console.warn('Connected');
				client.publish(
					'aaa',
					JSON.stringify({
						clientId: clientId,
						status: 'connected'
					})
				);
			} else {
				console.log(err);
			}
		});
	});

	client.on('message', function(topic, message) {
		let data = JSON.parse(message);
		// console.log(data);

		if (data.status != undefined && data.status === 'connectionRequest') {
			if (data.clientId === clientId && !multiplayer) {
				multiplayer = true;
				otherPlayer = gameObj.physics.add.sprite(width / 2, height - height * 0.5, 'player');
				// player.displayWidth = ;
				otherPlayer.scaleY = otherPlayer.scaleX = boundingWidth / 1400;

				gameObj.physics.add.existing(otherPlayer);
				otherPlayer.setDepth(10);
				otherPlayer.alpha = 0.2;

				otherPlayer.body.bounce.x = 0.2;
				otherPlayer.body.bounce.y = 0.2;

				otherPlayer.body.setCollideWorldBounds = true;
				gameObj.physics.add.collider(otherPlayer, platforms);
			}
		}
		if (data.clientId === clientId) return;
		if (data.status != undefined && data.status === 'connected') {
			host = false;
			client.publish(
				'aaa',
				JSON.stringify({
					clientId: data.clientId,
					status: 'connectionRequest'
				})
			);
		}
		if (data.status != undefined && data.status === 'newEnemy') {
			if (data.type === 'icicle') {
				let [x, y] = getRealPositions(data.x, data.y);

				ice = gameObj.physics.add.sprite(x, y, 'icicle');
				ice.scaleY = ice.scaleX = boundingWidth / 6000;

				gameObj.physics.add.existing(ice);
				ice.setDepth(1000);
				ice.setOrigin(0.5, 0);
				ice.body.bounce.x = 0.2;
				ice.body.bounce.y = 0.2;
				// ice.body.velocity.y = 500;

				// ice.body.setCollideWorldBounds(true);
				ice.body.onWorldBounds = true;

				// this.physics.add.collider(ice, platforms);
				enemies.push(ice);
				enemiesSpawned++;
			} else if (data.type === 'penguin') {
				let [x, y] = getRealPositions(data.x, data.y);

				let list;

				//Randomize left/right
				if (!data.flip) {
					list = penguinsLEFT;
				} else {
					list = penguinsRIGHT;
				}

				let penguin = gameObj.physics.add.sprite(x, y, 'penguin');

				penguin.scaleY = penguin.scaleX = boundingWidth / 15000;
				penguin.flipX = data.flip;
				penguin.setOrigin(0.5, 0);

				gameObj.physics.add.existing(penguin);
				penguin.setDepth(1000);
				penguin.body.bounce.x = 0.5;
				penguin.body.bounce.y = 0.5;

				// penguin.body.setCollideWorldBounds(true);
				penguin.body.onWorldBounds = true;

				gameObj.physics.add.collider(penguin, platforms);
				enemies.push(penguin);
				list.push(penguin);
				enemiesSpawned++;
			}
		}
		if (data.status != undefined && data.status === 'start') {
			started = true;
		}
		if (data.status != undefined && data.status === 'movement') {
			if (data.isRunning != undefined) otherPlayerData.isRunning = data.isRunning;
			if (data.direction != undefined) otherPlayerData.direction = data.direction;
			if (data.isJumping != undefined) otherPlayerData.isJumping = data.isJumping;

			if (data.x != undefined || data.y != undefined) {
				let [x, y] = getRealPositions(data.x, data.y);
				otherPlayerData.x = x;
				otherPlayerData.y = y;
				// console.warn(x, y);
				if (otherPlayer == undefined) {
					multiplayer = true;
					otherPlayer = gameObj.physics.add.sprite(width / 2, height - height * 0.5, 'player');
					// player.displayWidth = ;
					otherPlayer.scaleY = otherPlayer.scaleX = boundingWidth / 1400;

					gameObj.physics.add.existing(otherPlayer);
					otherPlayer.setDepth(10);
					otherPlayer.alpha = 0.2;

					otherPlayer.body.bounce.x = 0.2;
					otherPlayer.body.bounce.y = 0.2;

					otherPlayer.body.setCollideWorldBounds = true;
					gameObj.physics.add.collider(otherPlayer, platforms);
				}
				otherPlayer.setPosition(x + otherPlayer.body.width / 2, y + otherPlayer.body.height / 2);
			}
		}
	});
}

function die() {
	console.warn('YOU DIED');
	// document.querySelector('canvas').classList.add('died');
}

const getNormalizedPositions = (xb, yb) => {
	let x = ((xb - (width - boundingWidth * 0.85) / 2) / boundingWidth) * 100;
	let y = (yb / boundingHeight) * 100;
	return [x, y];
};
const getRealPositions = (xb, yb) => {
	let x = (xb / 100) * boundingWidth + (width - boundingWidth * 0.85) / 2;
	let y = (yb / 100) * boundingHeight;
	return [x, y];
};
const calcWidthHeight = () => {
	let width = window.innerWidth > window.innerHeight ? window.innerWidth : window.innerHeight;
	let height = window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth;
	return [width, height];
};

const calcGameBounds = height => {
	return [height * 1.77, height];
};

const resize = () => {
	let newWidth,
		newHeight = calcWidthHeight();

	let newBoundingWidth,
		newBoundingHeight = calcGameBounds(height);

	if (newWidth === width && newHeight === height && newBoundingWidth === boundingWidth && newBoundingHeight === boundingHeight) return;

	width, (height = [newWidth, newHeight]);
	boundingWidth, (boundingHeight = [newBoundingWidth, newBoundingHeight]);
	console.log('Resize');

	currentScene.scene.restart();
};

const init = () => {
	// screen.orientation.lock('landscape-primary');

	[width, height] = calcWidthHeight();

	[boundingWidth, boundingHeight] = calcGameBounds(height);

	var config = {
		type: Phaser.CANVAS,
		width: 1920,
		height: 1080,
		// scale: {
		// 	parent: 'body',
		// 	mode: Phaser.Scale.FIT,
		// 	width: width,
		// 	height: height
		// },
		physics: {
			default: 'arcade',
			arcade: {
				gravity: {
					y: height
				},
				debug: false
			}
		},
		scene: {
			preload: preload,
			create: create,
			update: update
		}
	};

	var game = new Phaser.Game(config);
};

document.addEventListener('DOMContentLoaded', () => {
	init();
});
