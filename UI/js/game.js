// var clientId = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));

// var lobbyId = 'abcdefg';

var width, height;

var boundingWidth, boundingHeight;

var screenangle = window.orientation;

var game;

var gyroscope = false;
var noSleep = new NoSleep();

var isFullscreen = false;
var scoreObject, highscoreObject, healthObjects, countdownWrapperObject;
var multiplayer = false;
var host = true;
var connectedCloud = false;
var setupMqttGameListener = false;
var started = false;
var platforms;
var gravity;

var avatars = [
	{ key: 'player1', crop: true },
	{ key: 'player2', crop: false },
	{ key: 'player3', crop: false },
	{ key: 'player4', crop: false }
];

var player;
var health = 3;
var invincible = false;
var avatar = avatars[1];
var beforePlayerData = {
	clientId: clientId,
	isRunning: false,
	direction: 0
};

var otherPlayer;
var otherPlayerData = {
	avatar: avatars[0],
	score: 0,
	alive: true,
	isRunning: false,
	direction: 0,
	isJumping: false,
	x: 0,
	y: 0
};

var icicleConfig = {
	gravity: 0.1, //20% of height
	minSpawnOffset: 1.15,
	maxSpawnOffset: 0.85
};
var penguinConfig = {
	speed: 0.2
};
var alive = true;
var currentScene;

var penguinsLEFT = [];
var penguinsRIGHT = [];

var enemies = [];
var lastTimeSpawn = new Date().getTime();

// let scoreText;
// let enemiesText;
let score = 0;

let gracePeriodFlickerTime = new Date().getTime();
let gracePeriodAlpha = false;
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

	// this.load.image('player1', 'assets/player.png');

	this.load.spritesheet('player1', 'assets/AvatarAfloatOne.png', {
		frameWidth: 355.5,
		frameHeight: 359
	});
	this.load.spritesheet('player2', 'assets/AvatarAfloatTwo.png', {
		frameWidth: 355.5,
		frameHeight: 357
	});
	this.load.spritesheet('player3', 'assets/AvatarAfloatThree.png', {
		frameWidth: 355.5,
		frameHeight: 357
	});
	this.load.spritesheet('player4', 'assets/AvatarAfloatFour.png', {
		frameWidth: 355.5,
		frameHeight: 357
	});

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
	gravity = height;

	/**
	 * Resize listeners
	 */
	window.removeEventListener('resize', resize);
	window.addEventListener('resize', resize);

	this.scale.setGameSize(width, height);
	this.scale.resize(width, height);
	// console.log(width, height);
	this.scale.scaleMode = Phaser.Scale.ScaleModes.FIT;

	this.scale.refresh();

	/**
	 * Background
	 */
	let bg = this.add.image(width / 2, height - height / 2, 'bg');
	bg.scaleX = bg.scaleY = width > height * 1.77 ? width / 7500 : height / 3500;
	// let bg = this.add.tileSprite(width / 2, height - height / 2, width, height, 'bg');
	// // bg.displayWidth = width < height ? width : height;

	// bg.tileScaleX = bg.tileScaleY = width > height * 1.77 ? width / 7500 : height / 7500;

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
	player = this.physics.add.sprite(width / 2, height - height * 0.5, avatar.key);
	// player.displayWidth = ;
	player.scaleY = player.scaleX = boundingWidth / 3000;

	// this.physics.add.existing(player);
	player.setDepth(100);

	player.setGravityY(gravity);

	// player.body.bounce.x = 0.1;
	// player.body.bounce.y = 0.1;

	player.body.setCollideWorldBounds = true;
	this.physics.add.collider(player, platforms);

	cursors = this.input.keyboard.createCursorKeys();
	avatars.forEach((el, i) => {
		this.anims.create({
			key: 'left' + i,
			frames: [{ key: el.key, frame: 0 }],
			frameRate: 10
		});
		this.anims.create({
			key: 'leftJump' + i,
			frames: [{ key: el.key, frame: 3 }],
			frameRate: 10
		});
		this.anims.create({
			key: 'turn' + i,
			frames: [{ key: el.key, frame: 1 }],
			frameRate: 20
		});
		this.anims.create({
			key: 'turnJump' + i,
			frames: [{ key: el.key, frame: 4 }],
			frameRate: 5
		});

		this.anims.create({
			key: 'right' + i,
			frames: [{ key: el.key, frame: 2 }],
			frameRate: 10
		});
		this.anims.create({
			key: 'rightJump' + i,
			frames: [{ key: el.key, frame: 5 }],
			frameRate: 10
		});
	});

	// /**
	//  * Sliding object
	//  */

	// let penguin = this.physics.add.sprite((width - boundingWidth * 0.85) / 2, height - height * 0.2, 'player1');
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
	// ice = this.physics.add.sprite(((width - boundingWidth * 0.85) / 2 + boundingWidth * 0.85) * icicleConfig.maxSpawnOffset, 0, 'player1');
	// ice.scaleY = ice.scaleX = boundingWidth / 3000;

	// this.physics.add.existing(ice);
	// ice.setDepth(10);
	// ice.body.bounce.x = 0.2;
	// ice.body.bounce.y = 0.2;
	// // ice.body.setCollideWorldBounds = true;
	// // this.physics.add.collider(ice, platforms);
	// enemies.push(ice);

	this.physics.add.overlap(player, enemies, hit, null, this);

	/**
	 * Click event
	 */
	this.input.on(
		'pointerup',
		function(pointer) {
			if (!isFullscreen) {
				this.scale.stopFullscreen();
				screen.orientation.lock('landscape-primary');
				document.documentElement.requestFullscreen();

				noSleep.enable();
				isFullscreen = true;
			}
			// if (this.scale.isFullscreen) {
			// 	this.scale.stopFullscreen();
			// 	noSleep.disable();
			// 	// On stop fulll screen
			// } else {
			// 	this.scale.startFullscreen();
			// 	noSleep.enable();
			// 	// On start fulll screen
			// }

			//   var iOS =
			//     /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
			try {
				if (!gyroscope && typeof DeviceMotionEvent.requestPermission === 'function') {
					DeviceMotionEvent.requestPermission()
						.then(response => {
							if (response == 'granted') {
								gyroscope = true;
								window.addEventListener(
									'deviceorientation',
									function(e) {
										processGyro(e.alpha, e.beta, e.gamma);
									},
									true
								);
							}
						})
						.catch(console.error);
				} else {
					// non iOS 13+
				}
			} catch {}

			if (player.body.touching.down) {
				player.body.velocity.y = (boundingHeight / 2) * 1.5 * -1;

				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isJumping: true
					};
					if (beforePlayerData.isJumping !== newPlayerData.isJumping) {
						let [x, y] = getNormalizedPositions(player.body.x, player.body.y);

						mqttClient.publish(
							`afloat/lobby/${lobbyId}/game`,
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
	// scoreText = this.add.text(width / 2, 0, 'Test', {
	// 	font: '65px Arial',
	// 	fill: '#ffffff',
	// 	align: 'center'
	// });
	//   enemiesText = this.add.text(width / 4, 0, 'Test', {
	//     font: '65px Arial',
	//     fill: '#ffffff',
	//     align: 'center'
	//   });

	/**
	 * Initialise MQTT
	 */
	if (multiplayer) {
		initMqtt(this);
	}
	/**
	 * Gyroscope
	 */

	// let text = this.add.text(0, 0, 'Test', {
	// 	font: '65px Arial',
	// 	fill: '#ff0044',
	// 	align: 'center'
	// });
	var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
	if (!iOS) {
		if (window.DeviceOrientationEvent) {
			window.addEventListener(
				'deviceorientation',
				function(e) {
					processGyro(e.alpha, e.beta, e.gamma);
				},
				true
			);
			gyroscope = true;
		} else {
		}

		// initGyroscope();
	} else {
		if (!gyroscope && typeof DeviceMotionEvent.requestPermission === 'function') {
			DeviceMotionEvent.requestPermission()
				.then(response => {
					if (response == 'granted') {
						gyroscope = true;
						window.addEventListener(
							'deviceorientation',
							function(e) {
								processGyro(e.alpha, e.beta, e.gamma);
							},
							true
						);
					}
				})
				.catch(console.error);
		} else {
			// non iOS 13+
			if (window.DeviceOrientationEvent) {
				window.addEventListener(
					'deviceorientation',
					function(e) {
						processGyro(e.alpha, e.beta, e.gamma);
					},
					true
				);
				gyroscope = true;
			} else {
			}
		}
	}
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
	if (invincible && new Date().getTime() - gracePeriodFlickerTime > 250) {
		// console.error('Invincible');
		if (gracePeriodAlpha) {
			player.alpha = 0.5;
			gracePeriodAlpha = false;
			gracePeriodFlickerTime = new Date().getTime();
		} else {
			player.alpha = 1;
			gracePeriodAlpha = true;
			gracePeriodFlickerTime = new Date().getTime();
		}
	}
	if (started) {
		penguinsLEFT.forEach((el, i) => {
			el.body.velocity.x = boundingWidth * penguinConfig.speed * -1;
		});
		penguinsRIGHT.forEach((el, i) => {
			el.body.velocity.x = boundingWidth * penguinConfig.speed;
		});
	}
	/**
	 * START DEBUG
	 */
	//!gyroscope
	if (!gyroscope && alive) {
		if (cursors.left.isDown && !cursors.right.isDown) {
			player.body.velocity.x = boundingWidth * -0.3;
			player.anims.play('left' + avatars.indexOf(avatar));
			if (avatar.crop) {
				player.height = 286.752;
				player.setCrop(0, 72.248, player.width, 286.752);
			}
			if (connectedCloud) {
				let newPlayerData = {
					clientId: clientId,
					isRunning: true,
					direction: -1
				};
				if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
					let [x, y] = getNormalizedPositions(player.body.x, player.body.y);
					mqttClient.publish(
						`afloat/lobby/${lobbyId}/game`,
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
			player.anims.play('right' + avatars.indexOf(avatar));
			if (avatar.crop) {
				player.height = 286.752;
				player.setCrop(0, 72.248, player.width, 286.752);
			}
			if (connectedCloud) {
				let newPlayerData = {
					clientId: clientId,
					isRunning: true,
					direction: 1
				};
				if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
					let [x, y] = getNormalizedPositions(player.body.x, player.body.y);
					mqttClient.publish(
						`afloat/lobby/${lobbyId}/game`,
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
			player.anims.play('turn' + avatars.indexOf(avatar));
			if (avatar.crop) {
				player.height = 286.752;
				player.setCrop(0, 72.248, player.width, 286.752);
			}
			if (connectedCloud) {
				let newPlayerData = {
					clientId: clientId,
					isRunning: false,
					direction: 0
				};
				if (beforePlayerData.isRunning !== newPlayerData.isRunning) {
					let [x, y] = getNormalizedPositions(player.body.x, player.body.y);
					mqttClient.publish(
						`afloat/lobby/${lobbyId}/game`,
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
		if (!player.body.touching.down) {
			player.isCropped = false;
			player.height = 359;

			if (player.body.velocity.x === 0) {
				player.anims.play('turnJump' + avatars.indexOf(avatar));
			} else {
				if (player.body.velocity.x > 0) player.anims.play('rightJump' + avatars.indexOf(avatar));
				if (player.body.velocity.x < 0) player.anims.play('leftJump' + avatars.indexOf(avatar));
			}
		}
		if (cursors.up.isDown && player.body.touching.down) {
			player.body.velocity.y = (boundingHeight / 2) * 1.5 * -1;

			if (connectedCloud) {
				let newPlayerData = {
					clientId: clientId,
					isJumping: true
				};
				if (beforePlayerData.isJumping !== newPlayerData.isJumping) {
					let [x, y] = getNormalizedPositions(player.body.x, player.body.y);
					mqttClient.publish(
						`afloat/lobby/${lobbyId}/game`,
						JSON.stringify({
							clientId: clientId,
							isJumping: true,
							status: 'movement',
							x: x,
							y: y
						})
					);
					// console.log('send jump');
					beforePlayerData = newPlayerData;
				}
			}
		}
	} else {
		if (!player.body.touching.down) {
			player.isCropped = false;
			player.height = 359;

			if (player.body.velocity.x === 0) {
				player.anims.play('turnJump' + avatars.indexOf(avatar));
			} else {
				if (player.body.velocity.x > 0) player.anims.play('rightJump' + avatars.indexOf(avatar));
				if (player.body.velocity.x < 0) player.anims.play('leftJump' + avatars.indexOf(avatar));
			}
		} else {
			if (connectedCloud) {
				let newPlayerData = {
					clientId: clientId,
					isJumping: false
				};
				if (beforePlayerData.isJumping !== newPlayerData.isJumping) {
					let [x, y] = getNormalizedPositions(player.body.x, player.body.y);

					mqttClient.publish(
						`afloat/lobby/${lobbyId}/game`,
						JSON.stringify({
							clientId: clientId,
							isJumping: false,
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
		let random = Math.random() * (3000 - 1000) + 3000;
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
					ice.setGravityY(gravity * icicleConfig.gravity);

					// ice.setGravityY(0.5);
					// ice.body.gravity.y = 2;
					// ice.body.setAllowGravity(false);
					// this.physics.add.existing(ice);
					ice.setDepth(1000);
					ice.setOrigin(0.5, 0);
					ice.body.bounce.x = 0.2;
					ice.body.bounce.y = 0.2;
					// ice.body.velocity.y = 500;

					// ice.body.setCollideWorldBounds(true);
					ice.body.onWorldBounds = true;

					// this.physics.add.collider(ice, platforms);
					enemies.push(ice);
					if (alive) addScore();

					let [xb, yb] = getNormalizedPositions(x, -1 * (boundingHeight * 0.4));
					if (connectedCloud) {
						mqttClient.publish(
							`afloat/lobby/${lobbyId}/game`,
							JSON.stringify({
								clientId: clientId,
								status: 'newEnemy',
								type: 'icicle',
								x: xb,
								y: yb
							})
						);
					}
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
					penguin.setGravityY(gravity);

					this.physics.add.existing(penguin);
					penguin.setDepth(1000);
					penguin.body.bounce.x = 0.5;
					penguin.body.bounce.y = 0.5;

					// penguin.body.setCollideWorldBounds(true);
					penguin.body.onWorldBounds = true;

					this.physics.add.collider(penguin, platforms);
					enemies.push(penguin);
					list.push(penguin);
					if (alive) addScore();
					let [xb, yb] = getNormalizedPositions(x, height - height * 0.2);
					if (connectedCloud) {
						mqttClient.publish(
							`afloat/lobby/${lobbyId}/game`,
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
			}
			lastTimeSpawn = new Date().getTime();
		}
	}
	//   enemiesText.setText(score);
	// scoreText.setText(score);

	if (multiplayer && otherPlayerData.alive && otherPlayer !== undefined) {
		// && otherPlayer !== undefined

		if (otherPlayerData.isRunning && otherPlayerData.direction == -1) {
			otherPlayer.body.velocity.x = boundingWidth * -0.3;
			otherPlayer.anims.play('left' + avatars.indexOf(otherPlayerData.avatar));
			if (otherPlayerData.avatar.crop) {
				otherPlayer.setCrop(0, 72.248, player.width, 286.752);
				otherPlayer.height = 286.752;
			}
			// console.log('Running left');
		} else if (otherPlayerData.isRunning && otherPlayerData.direction == 1) {
			otherPlayer.body.velocity.x = boundingWidth * 0.3;
			otherPlayer.anims.play('right' + avatars.indexOf(otherPlayerData.avatar));
			if (otherPlayerData.avatar.crop) {
				otherPlayer.setCrop(0, 72.248, player.width, 286.752);
				otherPlayer.height = 286.752;
			}

			// console.log('Running right');
		} else {
			otherPlayer.body.velocity.x = 0;
			otherPlayer.anims.play('turn' + avatars.indexOf(otherPlayerData.avatar));
			if (otherPlayerData.avatar.crop) {
				otherPlayer.setCrop(0, 72.248, player.width, 286.752);
				otherPlayer.height = 286.752;
			}

			// console.log('Standstill');
		}
		if (!otherPlayer.body.touching.down) {
			if (otherPlayer.body.velocity.x === 0) otherPlayer.anims.play('turnJump' + avatars.indexOf(otherPlayerData.avatar));
			if (otherPlayer.body.velocity.x > 0) otherPlayer.anims.play('rightJump' + avatars.indexOf(otherPlayerData.avatar));
			if (otherPlayer.body.velocity.x < 0) otherPlayer.anims.play('leftJump' + avatars.indexOf(otherPlayerData.avatar));
			if (otherPlayerData.avatar.crop) {
				otherPlayer.isCropped = false;
				otherPlayer.height = 359;
			}
		}
		if (otherPlayerData.isJumping && otherPlayer.body.touching.down) {
			otherPlayer.body.velocity.y = (boundingHeight / 2) * 1.5 * -1; //((player.height + boundingHeight) / 2) * 1.2 * -1
			otherPlayerData.isJumping = false;

			// console.log('Jumping');
		}
		// } catch (ex) {
		// 	console.error(ex);
		// }
	}
	if (player.body.y > height) {
		hit();
	}
}

/**
 * Game Utility functions
 */
function addScore() {
	score++;
	scoreObject.innerHTML = score;
}

function initMqtt(gameObj) {
	// if (connectedCloud) {
	// 	// mqttClient.end(true);
	// 	// mqttClient.close();
	// }

	// client = mqtt.connect(`wss://mct-mqtt.westeurope.cloudapp.azure.com`, {
	// 	//wss://mqtt.funergydev.com:9001
	// 	//51.105.206.206
	// 	protocolId: 'MQTT'
	// });
	mqttClient.subscribe(`afloat/lobby/${lobbyId}/game`, function(err) {
		if (!err) {
			// console.log(`afloat/lobby/${lobbyId}/game`);
			connectedCloud = true;
			console.warn('Subscribed to ' + `afloat/lobby/${lobbyId}/game`);
			// let random = Math.random() * (200 - 100) + 100;
			mqttClient.publish(
				`afloat/lobby/${lobbyId}/game`,
				JSON.stringify({
					clientId: clientId,
					status: 'connected',
					avatar: avatars.indexOf(avatar)
				})
			);
			// setTimeout(() => {
			// 	mqttClient.publish(
			// 		`afloat/lobby/${lobbyId}/game`,
			// 		JSON.stringify({
			// 			clientId: clientId,
			// 			status: 'connected',
			// 			avatar: avatars.indexOf(avatar)
			// 		})
			// 	);
			// }, random);
		} else {
			console.log(err);
		}
	});
	if (!setupMqttGameListener) {
		mqttClient.on('message', function(topic, message) {
			if (topic == `afloat/lobby/${lobbyId}/game`) {
				let data = JSON.parse(message);
				// console.log(data);
				if (data.clientId === clientId) return;

				if (data.status != undefined && data.status === 'connectionRequest') {
					console.warn(`Connection request from: ${data.clientId}`);
					// multiplayer = true;
					otherPlayerData.avatar = avatars[data.avatar];
					console.warn(`Spawning player: ${data.clientId} / With skin ${otherPlayerData.avatar.key}`);

					otherPlayer = gameObj.physics.add.sprite(width / 2, height - height * 0.5, otherPlayerData.avatar.key);
					// player.displayWidth = ;
					otherPlayer.scaleY = otherPlayer.scaleX = boundingWidth / 3000;
					otherPlayer.setGravityY(gravity);

					// gameObj.physics.add.existing(otherPlayer);
					otherPlayer.setDepth(10);
					otherPlayer.alpha = 0.2;

					// otherPlayer.body.bounce.x = 0.1;
					// otherPlayer.body.bounce.y = 0.1;

					otherPlayer.body.setCollideWorldBounds = true;
					gameObj.physics.add.collider(otherPlayer, platforms);
					if (host) {
						mqttClient.publish(
							`afloat/lobby/${lobbyId}/game`,
							JSON.stringify({
								clientId: clientId,
								status: 'start'
							})
						);
						startGame();
					}
				}
				if (data.status != undefined && data.status === 'connected') {
					host = false;
					console.warn(`User Connected: ${data.clientId}`);

					mqttClient.publish(
						`afloat/lobby/${lobbyId}/game`,
						JSON.stringify({
							clientId: clientId,
							status: 'connectionRequest',
							avatar: avatars.indexOf(avatar)
						})
					);
					// multiplayer = true;
					otherPlayerData.avatar = avatars[data.avatar];
					console.warn(`Spawning player: ${data.clientId} / With skin ${otherPlayerData.avatar.key}`);

					otherPlayer = gameObj.physics.add.sprite(width / 2, height - height * 0.5, otherPlayerData.avatar.key);
					// player.displayWidth = ;
					otherPlayer.scaleY = otherPlayer.scaleX = boundingWidth / 3000;
					otherPlayer.setGravityY(gravity);

					// gameObj.physics.add.existing(otherPlayer);
					otherPlayer.setDepth(10);
					otherPlayer.alpha = 0.2;

					// otherPlayer.body.bounce.x = 0.1;
					// otherPlayer.body.bounce.y = 0.1;

					otherPlayer.body.setCollideWorldBounds = true;
					gameObj.physics.add.collider(otherPlayer, platforms);
				}
				if (data.status != undefined && data.status === 'newEnemy') {
					if (data.type === 'icicle') {
						let [x, y] = getRealPositions(data.x, data.y);

						ice = gameObj.physics.add.sprite(x, y, 'icicle');
						ice.scaleY = ice.scaleX = boundingWidth / 6000;
						ice.setGravityY(gravity * icicleConfig.gravity);
						// ice.setGravityY(2);
						// ice.body.gravity.y = 2;
						// gameObj.physics.add.existing(ice);
						ice.setDepth(1000);
						ice.setOrigin(0.5, 0);
						ice.body.bounce.x = 0.2;
						ice.body.bounce.y = 0.2;
						// ice.body.velocity.y = 500;

						// ice.body.setCollideWorldBounds(true);
						ice.body.onWorldBounds = true;

						// this.physics.add.collider(ice, platforms);
						enemies.push(ice);
						if (alive) addScore();
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
						penguin.setGravityY(gravity);

						gameObj.physics.add.existing(penguin);
						penguin.setDepth(1000);
						penguin.body.bounce.x = 0.5;
						penguin.body.bounce.y = 0.5;

						// penguin.body.setCollideWorldBounds(true);
						penguin.body.onWorldBounds = true;

						gameObj.physics.add.collider(penguin, platforms);
						enemies.push(penguin);
						list.push(penguin);
						if (alive) addScore();
					}
				}
				if (data.status != undefined && data.status === 'disconnect') {
					otherPlayer.setActive(false).setVisible(false);
					multiplayer = false;
					host = true;
				}
				if (data.status != undefined && data.status === 'start') {
					startGame();
				}
				if (data.status != undefined && data.status === 'respawn') {
					otherPlayer.setPosition(width / 2, height - height * 0.5);
				}
				if (data.status != undefined && data.status === 'died') {
					// console.log('Other player died');
					otherPlayer.setActive(false).setVisible(false);
					otherPlayerData.alive = false;
					otherPlayerData.score = data.score;
					if (!alive) {
						endGame();
					}
				}
				if (data.status != undefined && data.status === 'movement') {
					if (data.isRunning != undefined) otherPlayerData.isRunning = data.isRunning;
					if (data.direction != undefined) otherPlayerData.direction = data.direction;
					if (data.isJumping != undefined) otherPlayerData.isJumping = data.isJumping;

					if (data.x != undefined || data.y != undefined) {
						let [x, y] = getRealPositions(data.x, data.y);
						otherPlayerData.x = x;
						otherPlayerData.y = y;
						otherPlayer.setPosition(x + otherPlayer.body.width / 2, otherPlayer.body.y + otherPlayer.body.height / 2);
					}
				}
			}
		});
		setupMqttGameListener = true;
	}
}
function processGyro(alpha, beta, gamma) {
	if (alive) {
		if (window.orientation === -90) {
			if (beta > 6) {
				player.body.velocity.x = boundingWidth * -0.3;
				player.anims.play('left' + avatars.indexOf(avatar));
				if (avatar.crop) {
					player.setCrop(0, 72.248, player.width, 286.752);
					player.height = 286.752;
				}

				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isRunning: true,
						direction: -1
					};
					if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
						let [x, y] = getNormalizedPositions(player.body.x, player.body.y);
						mqttClient.publish(
							`afloat/lobby/${lobbyId}/game`,
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
			} else if (beta < -6) {
				player.body.velocity.x = boundingWidth * 0.3;
				player.anims.play('right' + avatars.indexOf(avatar));
				if (avatar.crop) {
					player.setCrop(0, 72.248, player.width, 286.752);
					player.height = 286.752;
				}

				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isRunning: true,
						direction: 1
					};
					if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
						let [x, y] = getNormalizedPositions(player.body.x, player.body.y);

						mqttClient.publish(
							`afloat/lobby/${lobbyId}/game`,
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
				player.anims.play('turn' + avatars.indexOf(avatar));
				if (avatar.crop) {
					player.setCrop(0, 72.248, player.width, 286.752);
					player.height = 286.752;
				}
				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isRunning: false,
						direction: 0
					};
					if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
						let [x, y] = getNormalizedPositions(player.body.x, player.body.y);

						mqttClient.publish(
							`afloat/lobby/${lobbyId}/game`,
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
		} else if (window.orientation === 90) {
			if (beta > 6) {
				player.body.velocity.x = boundingWidth * 0.3;
				player.anims.play('right' + avatars.indexOf(avatar));
				if (avatar.crop) {
					player.setCrop(0, 72.248, player.width, 286.752);
					player.height = 286.752;
				}
				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isRunning: true,
						direction: 1
					};
					if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
						let [x, y] = getNormalizedPositions(player.body.x, player.body.y);

						mqttClient.publish(
							`afloat/lobby/${lobbyId}/game`,
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
			} else if (beta < -6) {
				player.body.velocity.x = boundingWidth * -0.3;
				player.anims.play('left' + avatars.indexOf(avatar));
				if (avatar.crop) {
					player.setCrop(0, 72.248, player.width, 286.752);
					player.height = 286.752;
				}
				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isRunning: true,
						direction: -1
					};
					if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
						let [x, y] = getNormalizedPositions(player.body.x, player.body.y);

						mqttClient.publish(
							`afloat/lobby/${lobbyId}/game`,
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
				player.anims.play('turn' + avatars.indexOf(avatar));
				if (avatar.crop) {
					player.setCrop(0, 72.248, player.width, 286.752);
					player.height = 286.752;
				}
				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isRunning: false,
						direction: 0
					};
					if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
						let [x, y] = getNormalizedPositions(player.body.x, player.body.y);

						mqttClient.publish(
							`afloat/lobby/${lobbyId}/game`,
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
		} else {
			if (gamma > 6) {
				player.body.velocity.x = boundingWidth * 0.3;
				player.anims.play('right' + avatars.indexOf(avatar));
				if (avatar.crop) {
					player.setCrop(0, 72.248, player.width, 286.752);
					player.height = 286.752;
				}
				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isRunning: true,
						direction: 1
					};
					if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
						let [x, y] = getNormalizedPositions(player.body.x, player.body.y);

						mqttClient.publish(
							`afloat/lobby/${lobbyId}/game`,
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
			} else if (gamma < -6) {
				player.body.velocity.x = boundingWidth * -0.3;
				player.anims.play('left' + avatars.indexOf(avatar));
				if (avatar.crop) {
					player.setCrop(0, 72.248, player.width, 286.752);
					player.height = 286.752;
				}
				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isRunning: true,
						direction: -1
					};
					if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
						let [x, y] = getNormalizedPositions(player.body.x, player.body.y);
						mqttClient.publish(
							`afloat/lobby/${lobbyId}/game`,
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
				player.anims.play('turn' + avatars.indexOf(avatar));
				if (avatar.crop) {
					player.setCrop(0, 72.248, player.width, 286.752);
					player.height = 286.752;
				}
				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isRunning: false,
						direction: 0
					};
					if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
						let [x, y] = getNormalizedPositions(player.body.x, player.body.y);
						mqttClient.publish(
							`afloat/lobby/${lobbyId}/game`,
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
		}
	}
}

function hit() {
	if (invincible || !alive) return;
	health--;
	if (health === 0) {
		// console.error('DIE');
		healthObjects[0].classList.add('c-game-overlay__heart--dead');
		die();
	} else {
		// console.error('NO DIE');
		healthObjects[health].classList.add('c-game-overlay__heart--dead');
		if (player.body.y > height) {
			player.setPosition(width / 2, height - height * 0.5);
			invincible = true;
			if (multiplayer) {
				mqttClient.publish(
					`afloat/lobby/${lobbyId}/game`,
					JSON.stringify({
						clientId: clientId,
						status: 'respawn'
					})
				);
			}
			setTimeout(() => {
				(invincible = false), (gracePeriodAlpha = false);
				player.alpha = 1;
			}, 2250);
		} else {
			invincible = true;

			setTimeout(() => {
				(invincible = false), (gracePeriodAlpha = false);
				player.alpha = 1;
			}, 1000);
		}
	}
}
function die() {
	// console.warn('YOU ARE DEAD');
	if (!alive) return;
	alive = false;
	document.querySelector('canvas').classList.add('c-died');
	player.setActive(false);
	player.setVisible(false);
	if (multiplayer) {
		mqttClient.publish(
			`afloat/lobby/${lobbyId}/game`,
			JSON.stringify({
				clientId: clientId,
				status: 'died',
				score: score
			})
		);
		if (!otherPlayerData.alive) {
			endGame();
		}
	} else {
		endGame();
	}
}
const endGame = () => {
	setTimeout(() => {
		if (multiplayer) {
			var scores = [
				{
					avatar: avatars.indexOf(avatar),
					score: score,
					offlinePlayer: true
				},
				{
					avatar: avatars.indexOf(otherPlayerData.avatar),
					score: otherPlayerData.score,
					offlinePlayer: false
				}
			];
			scores.sort(function(a, b) {
				return b.score - a.score;
			});
			showResults(scores);
			otherPlayerData = {
				avatar: avatars[0],
				score: 0,
				alive: true,
				isRunning: false,
				direction: 0,
				isJumping: false,
				x: 0,
				y: 0
			};
			otherPlayer = undefined;
			beforePlayerData = {
				clientId: clientId,
				isRunning: false,
				direction: 0
			};
			endGameLobby();
			connectedCloud = false;
			mqttClient.unsubscribe(`afloat/lobby/${lobbyId}/game`);
			mqttClient.unsubscribe(`afloat/lobby/${lobbyId}`);
		} else {
			showResults([
				{
					avatar: avatars.indexOf(avatar),
					score: score,
					offlinePlayer: true
				}
			]);
		}
		document.querySelectorAll('.js-lobby-menu-id').forEach(el => {
			el.innerHTML = currentLobby.menuId;
		});
		document.querySelector('.js-game').classList.add('c-hidden');
		document.querySelector('.js-main__results').classList.remove('c-hidden');
		// location.reload();
		currentScene.scene.stop();
		started = false;
		healthObjects.forEach(el => {
			el.classList.remove('c-game-overlay__heart--dead');
		});
		score = 0;
		alive = true;
		health = 3;

		scoreObject.innerHTML = 0;
		document.querySelector('canvas').classList.remove('c-died');
	}, 1000);
};
const disconnectMultiplayer = () => {
	mqttClient.publish(
		`afloat/lobby/${lobbyId}/game`,
		JSON.stringify({
			clientId: clientId,
			status: 'disconnect'
		})
	);
};
const startGame = () => {
	highscoreObject.innerHTML = leaderboard[0].score;
	let countdown = 5;
	let countdownInterval;
	countdownInterval = setInterval(() => {
		if (countdown == 0) {
			countdownWrapperObject.innerHTML = '';

			clearInterval(countdownInterval);
			started = true;
			// console.log('Starting');
		} else {
			countdownWrapperObject.innerHTML = `<h1 class="c-game-overlay__countdown js-countdown">${countdown}</h1>`;
			setTimeout(() => {
				let countdownObject = document.querySelector('.js-countdown');
				countdownObject.classList.add('c-game-overlay__countdown--big');
			}, 100);

			countdown--;
		}
	}, 1000);
};
const initialiseNewGame = (avatarid, multiplayerBool = false) => {
	multiplayer = multiplayerBool;
	avatar = avatars[avatarid];

	game.scene.start('game');
	
	if (!multiplayer) {
		startGame();
	}
	// setTimeout(() => {
	// 	game.scene.stop('game');
	// }, 1000);
};

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
	const dpr = window.devicePixelRatio;
	let width = window.innerWidth > window.innerHeight ? window.innerWidth * dpr : window.innerHeight * dpr;
	let height = window.innerWidth > window.innerHeight ? window.innerHeight * dpr : window.innerWidth * dpr;
	return [width, height];
};

const calcGameBounds = height => {
	return [height * 1.77, height];
};

const resize = () => {
	let newWidth,
		newHeight = calcWidthHeight();

	let newBoundingWidth,
		newBoundingHeight = calcGameBounds(newHeight);

	// if (newWidth === width && newHeight === height && newBoundingWidth === boundingWidth && newBoundingHeight === boundingHeight) return;

	[width, height] = [newWidth, newHeight];
	// console.log(grv)

	[boundingWidth, boundingHeight] = [newBoundingWidth, newBoundingHeight];
	// console.log('Resize');
	disconnectMultiplayer();
	leaveLobby();
	location.reload();

	// currentScene.scale.parent.width = Math.round(window.innerWidth);
	// currentScene.scale.parent.height = Math.round(window.innerHeight);

	// currentScene.scale.canvas.width = width;
	// currentScene.scale.canvas.height = height;
	// currentScene.scale.canvas.style.width = Math.round(window.innerWidth) + 'px';
	// currentScene.scale.canvas.style.height = Math.round(window.innerHeight) + 'px';

	// currentScene.scene.restart();
};
const initGame = () => {
	[width, height] = calcWidthHeight();

	[boundingWidth, boundingHeight] = calcGameBounds(height);
	gravity = height;

	var config = {
		type: Phaser.CANVAS,
		width: width,
		height: height,
		scale: {
			parent: 'c-game-area',
			mode: Phaser.Scale.FIT,
			width: width,
			height: height
		},
		physics: {
			default: 'arcade',
			arcade: {
				// gravity: {
				// 	y: height
				// },
				debug: false
			}
		}
		// scene: {
		// 	preload: preload,
		// 	create: create,
		// 	update: update
		// }
	};
	game = new Phaser.Game(config);
	currentScene = game.scene.add(
		'game',
		{
			preload: preload,
			create: create,
			update: update
		},
		false
	);
};

const initFramework = () => {
	// screen.orientation.lock('landscape-primary');

	var url = new URL(window.location);
	avatar = avatars[parseInt(url.searchParams.get('avatar'))];
	if (avatar == undefined) {
		avatar = avatars[0];
	}

	window.addEventListener('beforeunload', () => {
		if (multiplayer && connectedCloud) {
			disconnectMultiplayer();
		} else {
			endGame();
		}
	});
	window.addEventListener('blur', () => {
		if (currentScene != undefined) {
			if (multiplayer && connectedCloud) {
				disconnectMultiplayer();
				endGame();
			} else {
				endGame();
			}
		}
	});

	scoreObject = document.querySelector('.js-current-score');
	highscoreObject = document.querySelector('.js-highscore');
	healthObjects = document.querySelectorAll('.js-health-heart');
	countdownWrapperObject = document.querySelector('.js-countdown-wrapper');

	document.documentElement.addEventListener('click', () => {
		if (!isFullscreen) {
			try {
				document.documentElement.requestFullscreen();
				screen.orientation.lock('landscape');
			} catch {}
			try {
				ScreenOrientation.lock('landscape');
			} catch {}
			noSleep.enable();
			isFullscreen = true;
			setTimeout(() => {
				initGame();
			}, 500);
		}
	});
};

document.addEventListener('DOMContentLoaded', () => {
	initFramework();
});
