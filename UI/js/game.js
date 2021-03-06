/**
 * Screen width and height
 */
let width;
let height;

/**
 * Requested Fullscreen
 */
let requestedFullscreen;

/**
 * Width based on height multiplied by 16:9 ratio, height = screen height
 */
let boundingWidth, boundingHeight;

/**
 * Orientation = eg 90deg or (-)180deg
 */
let screenangle = window.orientation;

/**
 * Game object. Is undefined if not loaded properly
 */
let game;

/**
 * If gyroscope setup does not work we should display error. Gyroscope goes to true if it works
 */
let gyroscope = false;

/**
 * No screen sleep object.
 */
let noSleep = new NoSleep();

/**
 * variable if game is in fullscreen
 */
let isFullscreen = false;

/**
 * DOM objects
 */
let scoreObject, highscorePositionObject, highscoreScoreObject, healthObjects, countdownWrapperObject;

/**
 * Multiplayer toggle
 */
let multiplayer = false;

/**
 * If host this code toggles if he can spawn objects or not
 */
let host = true;

/**
 * If connected to the MQTT room
 */
let connectedCloud = false;

/**
 * Check if the on message event listener has been registered already
 */
let setupMqttGameListener = false;

/**
 * Check if game has started
 */
let started = false;

/**
 * Platform where objects can stand on
 */
let platforms;

/**
 * Variable which defines gravity
 */
let gravity;

/**
 * Avatar list
 */
let avatars = [
	{
		key: 'player1',
		crop: true
	},
	{
		key: 'player2',
		crop: false
	},
	{
		key: 'player3',
		crop: false
	},
	{
		key: 'player4',
		crop: false
	}
];

/**
 * Current player object
 */
let player;

/**
 * Player object that defines if current player is alive or not
 */
let alive = true;

/**
 * Health object. can range from 0->3
 */
let health = 3;

/**
 * Holds the current player score
 */
let score = 0;

/**
 * Defines if current player should be invincible
 */
let invincible = false;

/**
 * Defines what avatar the current player has chosen
 */
let avatar = avatars[1];

/**
 * Object for multiplayer that checks if it's not sending double redundant data
 */
let beforePlayerData = {
	clientId: clientId,
	isRunning: false,
	direction: 0
};

/**
 * Object for multiplayer that holds the other player object
 */
let otherPlayer;

/**
 * Object for multiplayer that holds the other player game information
 */
let otherPlayerData = {
	avatar: avatars[0],
	score: undefined,
	alive: true,
	isRunning: false,
	direction: 0,
	isJumping: false,
	x: 0,
	y: 0
};

/**
 * Modi
 */
let modi = [
	{
		name: 'Plank',
		minSpawnTime: 2300,
		maxSpawnTime: 4000,
		penguinChance: 0.3,
		icicleChance: 0.65,
		healthPowerupChance: 0.05,
		icicleConfig: {
			gravity: 0.1, //10% of height
			minSpawnOffset: 1.15,
			maxSpawnOffset: 0.85
		},
		penguinConfig: {
			speed: 0.25
		},
		jumpSensitivity: 5,
		walkSensitivity: 3
	},
	{
		name: 'Staan',
		minSpawnTime: 3500,
		maxSpawnTime: 5500,
		penguinChance: 0.2,
		icicleChance: 0.75,
		healthPowerupChance: 0.05,
		icicleConfig: {
			gravity: 0.1, //10% of height
			minSpawnOffset: 1.15,
			maxSpawnOffset: 0.85
		},
		penguinConfig: {
			speed: 0.2
		},
		jumpSensitivity: 5.25,
		walkSensitivity: 4
	},
	{
		name: 'Staan + squat',
		minSpawnTime: 3500,
		maxSpawnTime: 5500,
		penguinChance: 0.2,
		icicleChance: 0.75,
		healthPowerupChance: 0.05,
		icicleConfig: {
			gravity: 0.1, //10% of height
			minSpawnOffset: 1.15,
			maxSpawnOffset: 0.85
		},
		penguinConfig: {
			speed: 0.2
		},
		jumpSensitivity: 5.25,
		walkSensitivity: 4
	}
];

/**
 * Selected modus
 */

let modus = modi[0];

/**
 * Holds the current scene
 */
let currentScene;

/**
 * Holds all penguin objects
 */
let penguinsLEFT = [];
let penguinsRIGHT = [];

/**
 * Holds all enemies
 */
let enemies = [];

/**
 * Heart powerups
 */
let healthPowerups = [];

/**
 * If client is the host it saves when the last time was when it spawned something
 */
let lastTimeSpawn = new Date().getTime();

/**
 * When the player is invincible this should tell how long it's been since it switched opacity
 */
let gracePeriodFlickerTime = new Date().getTime();

/**
 * When the player is invincible this should tell to what opacity it should be switched to
 */
let gracePeriodAlpha = false;

/**
 * Music object
 */
let music;
/**
 * Game life cycles
 */

/**
 * Loads all images
 */
function preload() {
	this.load.image('bg', 'assets/bg.png');
	this.load.image('platform-full', 'assets/PlatformAfloatFullHigher.png');

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

	this.load.image('heart', 'assets/heart.png');

	this.load.audio('themesong', 'assets/afloatmusic.mp3');
}

/**
 * Creates the whole game at start
 */
function create() {
	/**
	 * Setting up variables
	 */

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
	this.scale.scaleMode = Phaser.Scale.ScaleModes.FIT;
	this.scale.refresh();

	/**
	 * Audio
	 */
	music = this.sound.add('themesong');

	music.loop = true;
	if (!document.querySelector('.js-mute-toggle').checked) music.play();
	// this.sfx.sonido.loopFull();

	/**
	 * Background
	 */
	let bg = this.add.image(width / 2, height - height / 2, 'bg');
	bg.scaleX = bg.scaleY = width > height * 1.77 ? width / 7500 : height / 3500;

	/**
	 * Platform group
	 */
	platforms = this.physics.add.staticGroup();

	/**
	 * Platform
	 */
	//tileSprite(x,y,width,height,imagekey)
	ts = this.add.tileSprite(width / 2, height - height * 0.1, boundingWidth * 0.85, (boundingWidth / 1344) * 96, 'platform-full');
	ts.tilePositionX = 0;
	ts.tilePositionY = 0;
	ts.setOrigin(0.5, 0);

	//scaling
	ts.tileScaleX = boundingWidth / 3540;
	ts.tileScaleY = boundingWidth / 3540;

	//add platform to platform group
	platforms.add(ts);

	/**
	 * Player
	 */
	//add.sprite(x,y,imagekey)
	player = this.physics.add.sprite(width / 2, height - height * 0.5, avatar.key);
	//scaling
	player.scaleY = player.scaleX = boundingWidth / 3000;

	//similar to z index in css
	player.setDepth(100);

	player.setGravityY(gravity);

	player.body.setCollideWorldBounds = true;

	//Player should stand on platform and not fall through
	this.physics.add.collider(player, platforms);

	//setup WASD buttons for debugging
	cursors = this.input.keyboard.createCursorKeys();

	//setup player animations for all avatars
	avatars.forEach((el, i) => {
		this.anims.create({
			key: 'left' + i,
			frames: [
				{
					key: el.key,
					frame: 0
				}
			],
			frameRate: 10
		});
		this.anims.create({
			key: 'leftJump' + i,
			frames: [
				{
					key: el.key,
					frame: 3
				}
			],
			frameRate: 10
		});
		this.anims.create({
			key: 'turn' + i,
			frames: [
				{
					key: el.key,
					frame: 1
				}
			],
			frameRate: 20
		});
		this.anims.create({
			key: 'turnJump' + i,
			frames: [
				{
					key: el.key,
					frame: 4
				}
			],
			frameRate: 5
		});

		this.anims.create({
			key: 'right' + i,
			frames: [
				{
					key: el.key,
					frame: 2
				}
			],
			frameRate: 10
		});
		this.anims.create({
			key: 'rightJump' + i,
			frames: [
				{
					key: el.key,
					frame: 5
				}
			],
			frameRate: 10
		});
	});

	//Player should be hit when it collides with an enemy
	this.physics.add.overlap(player, enemies, hit, null, this);

	//Player should get an extra heart when it collides with a health powerup
	this.physics.add.overlap(healthPowerups, player, useHealthPowerup, null, this);

	/**
	 * Spawn second player if multiplayer is true
	 */
	if (multiplayer) {
		//Adding player to the canvas
		otherPlayer = this.physics.add.sprite(width / 2, height - height * 0.5, otherPlayerData.avatar.key);
		otherPlayer.scaleY = otherPlayer.scaleX = boundingWidth / 3000;
		otherPlayer.setGravityY(gravity);

		otherPlayer.setDepth(10);

		//Set other player transparency
		otherPlayer.alpha = 0.5;

		otherPlayer.body.setCollideWorldBounds = true;

		//Player should stand on the platform
		this.physics.add.collider(otherPlayer, platforms);
	}

	/**
	 * Click event -> Jump
	 */
	this.input.on(
		'pointerup',
		function(pointer) {
			if (player.body.touching.down) {
				player.body.velocity.y = (boundingHeight / 2) * 1.5 * -1;

				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isJumping: true
					};
					if (beforePlayerData.isJumping !== newPlayerData.isJumping) {
						//Make x,y positions relative for other resolutions and aspect ratios
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
	 * If multiplayer -> initialise MQTT
	 */
	if (multiplayer) {
		initMqtt(this);
	}

	/**
	 * Setup gyroscope
	 */

	let iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
	if (!iOS) {
		if (window.DeviceOrientationEvent) {
			window.addEventListener('deviceorientation', processGyro);
			gyroscope = true;
		} else {
		}
	} else {
		if (!gyroscope && typeof DeviceMotionEvent.requestPermission === 'function') {
			DeviceMotionEvent.requestPermission()
				.then(response => {
					if (response == 'granted') {
						gyroscope = true;
						window.addEventListener('deviceorientation', processGyro);
					}
				})
				.catch(console.error);
		} else {
			// non iOS 13+
			if (window.DeviceOrientationEvent) {
				window.addEventListener('deviceorientation', processGyro);
				gyroscope = true;
			} else {
			}
		}
	}

	/**
	 * Start game automatically if singleplayer
	 */
	if (!multiplayer) {
		startGame();
	}
}
/**
 * Game loop. Calls itself multiple times a second.
 */
function update() {
	/**
	 * Flickers player when he's invincible
	 */
	if (invincible && new Date().getTime() - gracePeriodFlickerTime > 250) {
		if (gracePeriodAlpha) {
			player.alpha = 0.1;
			gracePeriodAlpha = false;
			gracePeriodFlickerTime = new Date().getTime();
		} else {
			player.alpha = 1;
			gracePeriodAlpha = true;
			gracePeriodFlickerTime = new Date().getTime();
		}
	}

	/**
	 * Moves all penguins
	 */
	if (started) {
		penguinsLEFT.forEach((el, i) => {
			el.body.velocity.x = boundingWidth * modus.penguinConfig.speed * -1;
		});
		penguinsRIGHT.forEach((el, i) => {
			el.body.velocity.x = boundingWidth * modus.penguinConfig.speed;
		});
	}

	/**
	 * Debug code which enables cursors for testing
	 */
	if (!gyroscope && alive) {
		/**
		 * When pressing left button
		 */
		if (cursors.left.isDown && !cursors.right.isDown) {
			//set velocity
			player.body.velocity.x = boundingWidth * -0.3;

			//play the correct animation
			player.anims.play('left' + avatars.indexOf(avatar));
			//crop if avatar needs it
			if (avatar.crop) {
				player.height = 286.752;
				player.setCrop(0, 72.248, player.width, 286.752);
			}

			//if multiplayer send player data to other users
			if (connectedCloud) {
				let newPlayerData = {
					clientId: clientId,
					isRunning: true,
					direction: -1
				};
				//check if player data is not a duplicate
				if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
					//Make x,y positions relative for other resolutions and aspect ratios
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

			/**
			 * When pressing right button
			 */
		} else if (cursors.right.isDown) {
			//set velocity
			player.body.velocity.x = boundingWidth * 0.3;

			//play the correct animation
			player.anims.play('right' + avatars.indexOf(avatar));
			//crop if avatar needs it
			if (avatar.crop) {
				player.height = 286.752;
				player.setCrop(0, 72.248, player.width, 286.752);
			}

			//if multiplayer send player data to other users
			if (connectedCloud) {
				let newPlayerData = {
					clientId: clientId,
					isRunning: true,
					direction: 1
				};
				//check if player data is not a duplicate
				if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
					//Make x,y positions relative for other resolutions and aspect ratios
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
			//set velocity
			player.body.velocity.x = 0;

			//play the correct animation
			player.anims.play('turn' + avatars.indexOf(avatar));
			//crop if avatar needs it
			if (avatar.crop) {
				player.height = 286.752;
				player.setCrop(0, 72.248, player.width, 286.752);
			}

			//if multiplayer send player data to other users
			if (connectedCloud) {
				let newPlayerData = {
					clientId: clientId,
					isRunning: false,
					direction: 0
				};
				//check if player data is not a duplicate
				if (beforePlayerData.isRunning !== newPlayerData.isRunning) {
					//Make x,y positions relative for other resolutions and aspect ratios
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

		/**
		 * When player is not touching the floor
		 */
		if (!player.body.touching.down) {
			//Disable crop for normal state
			player.isCropped = false;
			player.height = 359;

			//Play correct animation
			if (player.body.velocity.x === 0) {
				player.anims.play('turnJump' + avatars.indexOf(avatar));
			} else {
				if (player.body.velocity.x > 0) player.anims.play('rightJump' + avatars.indexOf(avatar));
				if (player.body.velocity.x < 0) player.anims.play('leftJump' + avatars.indexOf(avatar));
			}
		}

		/**
		 * When the up button is being pressed -> jump
		 */
		if (cursors.up.isDown && player.body.touching.down) {
			//Set velocity
			player.body.velocity.y = (boundingHeight / 2) * 1.5 * -1;

			//if multiplayer send player data to other users
			if (connectedCloud) {
				let newPlayerData = {
					clientId: clientId,
					isJumping: true
				};
				//check if player data is not a duplicate
				if (beforePlayerData.isJumping !== newPlayerData.isJumping) {
					//Make x,y positions relative for other resolutions and aspect ratios
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
	} else {
		/**
		 * When player is not touching the floor
		 */
		if (!player.body.touching.down) {
			//Disable crop for normal state
			player.isCropped = false;
			player.height = 359;

			//Play correct animation
			if (player.body.velocity.x === 0) {
				player.anims.play('turnJump' + avatars.indexOf(avatar));
			} else {
				if (player.body.velocity.x > 0) player.anims.play('rightJump' + avatars.indexOf(avatar));
				if (player.body.velocity.x < 0) player.anims.play('leftJump' + avatars.indexOf(avatar));
			}
		} else {
			//Player is touching the floor -> send update if multiplayer
			if (connectedCloud) {
				let newPlayerData = {
					clientId: clientId,
					isJumping: false
				};
				//Check if not duplicate
				if (beforePlayerData.isJumping !== newPlayerData.isJumping) {
					//Make x,y positions relative for other resolutions and aspect ratios
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
	 * If client is host and game has started -> spawn new objects
	 */
	if ((host || !multiplayer) && started) {
		/**
		 * Randomize when an object is being spawned
		 */
		let random = Math.random() * (modus.maxSpawnTime - modus.minSpawnTime) + modus.minSpawnTime;
		if (new Date().getTime() - lastTimeSpawn > random) {
			/**
			 * 80% chance for icicle
			 * 20% chance for penguin
			 */
			let spawnChance = Math.random();
			if (spawnChance <= modus.icicleChance) {
				/**
				 * Spawn icicle
				 */

				//Randomize spawn location
				let x =
					Math.random() *
						(((width - boundingWidth * 0.85) / 2 + boundingWidth * 0.85) * modus.icicleConfig.maxSpawnOffset - ((width - boundingWidth * 0.85) / 2) * modus.icicleConfig.minSpawnOffset) +
					((width - boundingWidth * 0.85) / 2) * modus.icicleConfig.minSpawnOffset;

				//Add sprite to the canvas
				ice = this.physics.add.sprite(x, -1 * (boundingHeight * 0.4), 'icicle');
				ice.scaleY = ice.scaleX = boundingWidth / 6000;

				//Set custom gravity (Icicle speed)
				ice.setGravityY(gravity * modus.icicleConfig.gravity);

				//Icicle should always be on top of player
				ice.setDepth(1000);
				ice.setOrigin(0.5, 0);

				//Add the Icicle to the enemies list
				enemies.push(ice);

				//If alive addScore
				if (alive) addScore();

				//Make x,y positions relative so other players with different resolution or aspect ratio get the correct position
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
			} else if (spawnChance <= modus.penguinChance + modus.icicleChance) {
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

				//Add penguin to the canvas
				let penguin = this.physics.add.sprite(x, height - height * 0.2, 'penguin');

				//Scaling
				penguin.scaleY = penguin.scaleX = boundingWidth / 16500;

				//Penguin should be flipped when going to the left
				penguin.flipX = flip;
				penguin.setOrigin(0.5, 0);

				//Set gravity
				penguin.setGravityY(gravity);

				penguin.setDepth(1000);

				penguin.body.bounce.x = 0.5;
				penguin.body.bounce.y = 0.5;

				//Penguins should be able to stand on the platform not fall through it
				this.physics.add.collider(penguin, platforms);

				//Add penguin to enemy list
				enemies.push(penguin);

				//Add penguin to the list if it should go right or left
				list.push(penguin);

				//Add score if still alive
				if (alive) addScore();

				//Make x,y positions relative so other players with different resolution or aspect ratio get the correct position
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
			} else {
				/**
				 * Spawn healthPowerup
				 */

				//Randomize spawn location
				let x =
					Math.random() *
						(((width - boundingWidth * 0.85) / 2 + boundingWidth * 0.85) * modus.icicleConfig.maxSpawnOffset - ((width - boundingWidth * 0.85) / 2) * modus.icicleConfig.minSpawnOffset) +
					((width - boundingWidth * 0.85) / 2) * modus.icicleConfig.minSpawnOffset;

				//Add sprite to the canvas
				let health = this.physics.add.sprite(x, -1 * (boundingHeight * 0.4), 'heart');
				health.scaleY = health.scaleX = boundingWidth / 22000;

				//Set gravity
				health.setGravityY(gravity);

				//HealthPowerup should always be on top of player
				health.setDepth(1000);
				health.setOrigin(0.5, 0);
				health.name = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));

				//HealthPowerup should stand on the platform, not fall through
				this.physics.add.collider(health, platforms);

				//Add the HealthPowerup to the powerup list
				healthPowerups.push(health);

				//Make x,y positions relative so other players with different resolution or aspect ratio get the correct position
				let [xb, yb] = getNormalizedPositions(x, -1 * (boundingHeight * 0.4));
				if (connectedCloud) {
					mqttClient.publish(
						`afloat/lobby/${lobbyId}/game`,
						JSON.stringify({
							clientId: clientId,
							status: 'newPowerup',
							type: 'health',
							id: health.name,
							x: xb,
							y: yb
						})
					);
				}
			}
			//Update when an enemy has spawned
			lastTimeSpawn = new Date().getTime();
		}
	}

	/**
	 * When multiplayer -> update player position
	 */
	if (multiplayer && otherPlayerData.alive && otherPlayer !== undefined) {
		/**
		 * If running to the left
		 */
		if (otherPlayerData.isRunning && otherPlayerData.direction == -1) {
			//Set velocity
			otherPlayer.body.velocity.x = boundingWidth * -0.3;
			//Play animation
			otherPlayer.anims.play('left' + avatars.indexOf(otherPlayerData.avatar));
			if (otherPlayerData.avatar.crop) {
				otherPlayer.setCrop(0, 72.248, player.width, 286.752);
				otherPlayer.height = 286.752;
			}

			/**
			 * If running to the right
			 */
		} else if (otherPlayerData.isRunning && otherPlayerData.direction == 1) {
			//Set velocity
			otherPlayer.body.velocity.x = boundingWidth * 0.3;
			//Play animation
			otherPlayer.anims.play('right' + avatars.indexOf(otherPlayerData.avatar));
			if (otherPlayerData.avatar.crop) {
				otherPlayer.setCrop(0, 72.248, player.width, 286.752);
				otherPlayer.height = 286.752;
			}

			/**
			 * If standing still
			 */
		} else {
			//Set velocity
			otherPlayer.body.velocity.x = 0;
			//Play animation
			otherPlayer.anims.play('turn' + avatars.indexOf(otherPlayerData.avatar));
			if (otherPlayerData.avatar.crop) {
				otherPlayer.setCrop(0, 72.248, player.width, 286.752);
				otherPlayer.height = 286.752;
			}
		}
		/**
		 * If other player is jumping
		 */
		if (!otherPlayer.body.touching.down) {
			//Play animation
			if (otherPlayer.body.velocity.x === 0) otherPlayer.anims.play('turnJump' + avatars.indexOf(otherPlayerData.avatar));
			if (otherPlayer.body.velocity.x > 0) otherPlayer.anims.play('rightJump' + avatars.indexOf(otherPlayerData.avatar));
			if (otherPlayer.body.velocity.x < 0) otherPlayer.anims.play('leftJump' + avatars.indexOf(otherPlayerData.avatar));
			if (otherPlayerData.avatar.crop) {
				otherPlayer.isCropped = false;
				otherPlayer.height = 359;
			}
		}
		/**
		 * If the other player is about to jump
		 */
		if (otherPlayerData.isJumping && otherPlayer.body.touching.down) {
			//Set velocity
			otherPlayer.body.velocity.y = (boundingHeight / 2) * 1.5 * -1;

			//Set jumping to false so the player won't jump twice
			otherPlayerData.isJumping = false;
		}
	}

	/**
	 * If player fell of the platform -> hit
	 */
	if (player.body.y > height) {
		hit();
	}

	/**
	 * Update highscore missions
	 */

	if (leaderboard !== undefined) {
		if (leaderboard.length !== 0) {
			let lowestScoreToBeat;
			let position = 1;
			leaderboard.forEach((el, i) => {
				if ((el.score < lowestScoreToBeat && el.score > score) || lowestScoreToBeat === undefined) {
					lowestScoreToBeat = el.score;
					position = i + 1;
				}
			});
			highscorePositionObject.innerHTML = `${position}e`;
			highscoreScoreObject.innerHTML = lowestScoreToBeat;
		} else {
			highscorePositionObject.innerHTML = `1e`;
			highscoreScoreObject.innerHTML = 0;
		}
	} else {
		highscorePositionObject.innerHTML = `1e`;
		highscoreScoreObject.innerHTML = 0;
	}
}

/**
 * Game Utility functions
 */

/**
 * Add score
 */
function addScore() {
	score++;
	scoreObject.innerHTML = score;
}

/**
 * Initialise MQTT
 * @param {GameObj} gameObj
 */
function initMqtt(gameObj) {
	//Subscribe to the correct lobby
	mqttClient.subscribe(`afloat/lobby/${lobbyId}/game`, function(err) {
		if (!err) {
			connectedCloud = true;
			console.warn('Subscribed to ' + `afloat/lobby/${lobbyId}/game`);

			/**
			 * Send a connected message to the other player
			 */
			// mqttClient.publish(
			// 	`afloat/lobby/${lobbyId}/game`,
			// 	JSON.stringify({
			// 		clientId: clientId,
			// 		status: 'connected',
			// 		avatar: avatars.indexOf(avatar)
			// 	})
			// );

			let random = Math.random() * 1000;

			setTimeout(() => {
				mqttClient.publish(
					`afloat/lobby/${lobbyId}/game`,
					JSON.stringify({
						clientId: clientId,
						status: 'connected',
						avatar: avatars.indexOf(avatar)
					})
				);
			}, random);
		} else {
			console.log(err);
		}
	});

	/**
	 * Setup event listener when someone sends a message
	 */
	if (!setupMqttGameListener) {
		mqttClient.on('message', function(topic, message) {
			/**
			 * If message matches the correct topic
			 */
			if (topic == `afloat/lobby/${lobbyId}/game`) {
				let data = JSON.parse(message);

				/**
				 * Skip all messages from itself
				 */
				if (data.clientId === clientId) return;

				/**
				 * If the player joins last he will get a connection request from the player that received the 'connected' message
				 */
				if (data.status != undefined && data.status === 'connectionRequest') {
					console.warn(`Connection request from: ${data.clientId}`);
					/**
					 * If player has joined the game should start
					 */
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

				/**
				 * If player receives a 'connected' message it means he joined first of the two
				 */
				if (data.status != undefined && data.status === 'connected') {
					console.warn(`User Connected: ${data.clientId}`);

					/**
					 * Tell the other player he's are here already
					 */
					mqttClient.publish(
						`afloat/lobby/${lobbyId}/game`,
						JSON.stringify({
							clientId: clientId,
							status: 'connectionRequest',
							avatar: avatars.indexOf(avatar)
						})
					);
					/**
					 * If player has joined the game should start
					 */
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

				/**
				 * Status newPowerup has spawned. This means this client is not the host
				 * and we should spawn the objects by his command
				 */
				if (data.status != undefined && data.status === 'newPowerup') {
					//Randomize spawn location
					let [x, y] = getRealPositions(data.x, data.y);

					//Add sprite to the canvas
					let health = gameObj.physics.add.sprite(x, -1 * (boundingHeight * 0.4), 'heart');
					health.scaleY = health.scaleX = boundingWidth / 22000;

					//Set gravity
					health.setGravityY(gravity);

					//HealthPowerup should always be on top of player
					health.setDepth(1000);
					health.setOrigin(0.5, 0);
					health.name = data.id;

					//HealthPowerup should stand on the platform, not fall through
					gameObj.physics.add.collider(health, platforms);

					//Add the HealthPowerup to the powerup list
					healthPowerups.push(health);
				}

				if (data.status != undefined && data.status === 'usePowerup') {
					healthPowerups.forEach(el => {
						if (el.name === data.id) {
							el.destroy();
						}
					});
				}
				/**
				 * Status when a new enemy has spawned. This means this client is not the host
				 * and we should spawn the objects by his command
				 */
				if (data.status != undefined && data.status === 'newEnemy') {
					/**
					 * If enemy is an icicle
					 */
					if (data.type === 'icicle') {
						//Convert relative positions to absolute
						let [x, y] = getRealPositions(data.x, data.y);

						//Add Icicle to the canvas
						ice = gameObj.physics.add.sprite(x, y, 'icicle');
						ice.scaleY = ice.scaleX = boundingWidth / 6000;
						ice.setGravityY(gravity * modus.icicleConfig.gravity);

						ice.setDepth(1000);
						ice.setOrigin(0.5, 0);

						ice.body.onWorldBounds = true;

						//Add enemy to list of enemies
						enemies.push(ice);

						//Add score if still alive
						if (alive) addScore();

						/**
						 * If enemy is a penguin
						 */
					} else if (data.type === 'penguin') {
						//Convert relative positions to absolute
						let [x, y] = getRealPositions(data.x, data.y);

						let list;

						//Randomize left/right
						if (!data.flip) {
							list = penguinsLEFT;
						} else {
							list = penguinsRIGHT;
						}

						//Add penguin to the canvas
						let penguin = gameObj.physics.add.sprite(x, y, 'penguin');

						penguin.scaleY = penguin.scaleX = boundingWidth / 16500;

						//If penguin should be flipped: direction left -> flipped
						penguin.flipX = data.flip;
						penguin.setOrigin(0.5, 0);
						penguin.setGravityY(gravity);

						penguin.setDepth(1000);
						penguin.body.bounce.x = 0.5;
						penguin.body.bounce.y = 0.5;

						penguin.body.onWorldBounds = true;

						//Penguin should stand on the platform, not fall through
						gameObj.physics.add.collider(penguin, platforms);
						//Add penguin to the list of enemies
						enemies.push(penguin);
						//Add penguin to the list of penguins that should go right or left
						list.push(penguin);

						//Add score if player is still alive
						if (alive) addScore();
					}
				}
				/**
				 * Other player disconnect status
				 */
				if (data.status != undefined && data.status === 'disconnect') {
					//Hide other player
					otherPlayer.setActive(false).setVisible(false);
					multiplayer = false;
					host = true;
				}
				/**
				 * Start status: Starts the game
				 */
				if (data.status != undefined && data.status === 'start') {
					startGame();
				}
				/**
				 * Respawns the other player
				 */
				if (data.status != undefined && data.status === 'respawn') {
					otherPlayer.setPosition(width / 2, height - height * 0.5);
				}
				/**
				 * Status that says the other player has died
				 */
				if (data.status != undefined && data.status === 'died') {
					//Hide other player
					otherPlayer.setActive(false).setVisible(false);
					//Set alive to false
					otherPlayerData.alive = false;
					//Save his score for the results page
					otherPlayerData.score = data.score;

					//If both players are dead -> End the game
					if (!alive) {
						endGame();
					}
				}
				/**
				 * If the other player has moved
				 */
				if (data.status != undefined && data.status === 'movement') {
					/**
					 * Update movement statusses
					 */
					if (data.isRunning != undefined) otherPlayerData.isRunning = data.isRunning;
					if (data.direction != undefined) otherPlayerData.direction = data.direction;
					if (data.isJumping != undefined) otherPlayerData.isJumping = data.isJumping;

					/**
					 * Update positions for accuracy
					 */
					try {
						if (data.x != undefined || data.y != undefined) {
							let [x, y] = getRealPositions(data.x, data.y);
							otherPlayerData.x = x;
							otherPlayerData.y = y;
							otherPlayer.setPosition(x + otherPlayer.body.width / 2, otherPlayer.body.y + otherPlayer.body.height / 2);
						}
					} catch (ex) {}
				}
			}
		});
		//Tell the game that it has already registered the mqtt event listener
		setupMqttGameListener = true;
	}
}

/**
 * Handles gyroscope changes
 * @param {Double} alpha
 * @param {Double} beta
 * @param {Double} gamma
 */
function processGyro(e) {
	let gamma = e.gamma;
	let beta = e.beta;
	//We should only process it if the player is still alive
	if (alive) {
		/**
		 * If orientation is alternative landscape
		 */
		if (window.orientation === -90) {
			/**
			 * Player goes left
			 */
			if (beta > modus.walkSensitivity) {
				//Set velocity
				player.body.velocity.x = boundingWidth * -0.3;

				//Play animation
				player.anims.play('left' + avatars.indexOf(avatar));
				//Set crop if avatar needs it
				if (avatar.crop) {
					player.setCrop(0, 72.248, player.width, 286.752);
					player.height = 286.752;
				}

				//If multiplayer send player update
				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isRunning: true,
						direction: -1
					};
					//Check for duplicate data
					if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
						//Make x,y positions relative for other resolutions and aspect ratios
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
						//Set new data as old data
						beforePlayerData = newPlayerData;
					}
				}
				/**
				 * Go right
				 */
			} else if (beta < modus.walkSensitivity * -1) {
				//Set velocity
				player.body.velocity.x = boundingWidth * 0.3;

				//Play animation
				player.anims.play('right' + avatars.indexOf(avatar));
				//Set crop if avatar needs it
				if (avatar.crop) {
					player.setCrop(0, 72.248, player.width, 286.752);
					player.height = 286.752;
				}
				//If multiplayer send player update
				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isRunning: true,
						direction: 1
					};
					//Check for duplicate data
					if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
						//Make x,y positions relative for other resolutions and aspect ratios
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
						//Set new data as old data
						beforePlayerData = newPlayerData;
					}
				}
				/**
				 * Standing still
				 */
			} else {
				//Set velocity
				player.body.velocity.x = 0;

				//Play animation
				player.anims.play('turn' + avatars.indexOf(avatar));
				//Set crop if avatar needs it
				if (avatar.crop) {
					player.setCrop(0, 72.248, player.width, 286.752);
					player.height = 286.752;
				}

				//If multiplayer send player update
				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isRunning: false,
						direction: 0
					};
					//Check for duplicate data
					if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
						//Make x,y positions relative for other resolutions and aspect ratios
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
						//Set new data as old data
						beforePlayerData = newPlayerData;
					}
				}
			}

			/**
			 * Jumping
			 */
			if (gamma > modus.jumpSensitivity || gamma < modus.jumpSensitivity * -1) {
				//Jump
				if (player.body.touching.down) {
					player.body.velocity.y = (boundingHeight / 2) * 1.5 * -1;

					if (connectedCloud) {
						let newPlayerData = {
							clientId: clientId,
							isJumping: true
						};
						if (beforePlayerData.isJumping !== newPlayerData.isJumping) {
							//Make x,y positions relative for other resolutions and aspect ratios
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
			}
			/**
			 * If orientation is landscape
			 */
		} else if (window.orientation === 90) {
			/**
			 * Go right
			 */
			if (beta > modus.walkSensitivity) {
				//Set velocity
				player.body.velocity.x = boundingWidth * 0.3;
				//Play animation
				player.anims.play('right' + avatars.indexOf(avatar));
				//Set crop if avatar needs it
				if (avatar.crop) {
					player.setCrop(0, 72.248, player.width, 286.752);
					player.height = 286.752;
				}

				//If multiplayer send player update
				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isRunning: true,
						direction: 1
					};
					//Check for duplicate data
					if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
						//Make x,y positions relative for other resolutions and aspect ratios
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
						//Set new data as old data
						beforePlayerData = newPlayerData;
					}
				}
				/**
				 * Go left
				 */
			} else if (beta < modus.walkSensitivity * -1) {
				//Set velocity
				player.body.velocity.x = boundingWidth * -0.3;
				//Play animation
				player.anims.play('left' + avatars.indexOf(avatar));
				//Set crop if avatar needs it
				if (avatar.crop) {
					player.setCrop(0, 72.248, player.width, 286.752);
					player.height = 286.752;
				}

				//If multiplayer send player update
				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isRunning: true,
						direction: -1
					};
					//Check for duplicate data
					if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
						//Make x,y positions relative for other resolutions and aspect ratios
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
						//Set new data as old data
						beforePlayerData = newPlayerData;
					}
				}
				/**
				 * Standing still
				 */
			} else {
				//Set velocity
				player.body.velocity.x = 0;
				//Play animation
				player.anims.play('turn' + avatars.indexOf(avatar));
				//Set crop if avatar needs it
				if (avatar.crop) {
					player.setCrop(0, 72.248, player.width, 286.752);
					player.height = 286.752;
				}

				//If multiplayer send player update
				if (connectedCloud) {
					let newPlayerData = {
						clientId: clientId,
						isRunning: false,
						direction: 0
					};
					//Check for duplicate data
					if (beforePlayerData.isRunning !== newPlayerData.isRunning || beforePlayerData.direction !== newPlayerData.direction) {
						//Make x,y positions relative for other resolutions and aspect ratios
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
						//Set new data as old data
						beforePlayerData = newPlayerData;
					}
				}
			}

			if (gamma > modus.jumpSensitivity || gamma < modus.jumpSensitivity * -1) {
				//Jump
				if (player.body.touching.down) {
					player.body.velocity.y = (boundingHeight / 2) * 1.5 * -1;

					if (connectedCloud) {
						let newPlayerData = {
							clientId: clientId,
							isJumping: true
						};
						if (beforePlayerData.isJumping !== newPlayerData.isJumping) {
							//Make x,y positions relative for other resolutions and aspect ratios
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
			}
			/**
			 * If orientation is portrait
			 */
		} else {
			if (gamma > 3) {
				//Go right
			} else if (gamma < -3) {
				//Go left
			} else {
				//Standing still
			}
		}
	}
}

function useHealthPowerup(obj) {
	if (alive) {
		obj.destroy();
		if (multiplayer) {
			mqttClient.publish(
				`afloat/lobby/${lobbyId}/game`,
				JSON.stringify({
					clientId: clientId,
					status: 'usePowerup',
					id: obj.name
				})
			);
		}
		if (health == 3) return;

		healthObjects[health].classList.remove('c-game-overlay__heart--dead');
		health++;
	}
}

/**
 * When a player is hit this function fires
 */
function hit() {
	//Do nothing if player is invincible
	if (invincible || !alive) return;

	if (!started) {
		if (player.body.y > height) {
			//Place him on the platform
			player.setPosition(width / 2, height - height * 0.5);

			if (multiplayer) {
				mqttClient.publish(
					`afloat/lobby/${lobbyId}/game`,
					JSON.stringify({
						clientId: clientId,
						status: 'respawn'
					})
				);
			}
		}
		return;
	}

	health--;

	/**
	 * If player is about to die
	 */
	if (health === 0) {
		//Remove the last heart
		healthObjects[0].classList.add('c-game-overlay__heart--dead');
		die();

		/**
		 * If player is not about to die
		 */
	} else {
		//Remove heart
		healthObjects[health].classList.add('c-game-overlay__heart--dead');

		/**
		 * If player fell of the platform
		 */
		if (player.body.y > height) {
			//Place him on the platform
			player.setPosition(width / 2, height - height * 0.5);

			//Set invincible
			invincible = true;

			//If multiplayer send respawn status
			if (multiplayer) {
				mqttClient.publish(
					`afloat/lobby/${lobbyId}/game`,
					JSON.stringify({
						clientId: clientId,
						status: 'respawn'
					})
				);
			}
			//Remove invicibility after 2.25 seconds
			setTimeout(() => {
				(invincible = false), (gracePeriodAlpha = false);
				player.alpha = 1;
			}, 2250);

			/**
			 * If player got hit by an object
			 */
		} else {
			//Set invincible
			invincible = true;

			//Remove invincibility after 1 second
			setTimeout(() => {
				(invincible = false), (gracePeriodAlpha = false);
				player.alpha = 1;
			}, 1500);
		}
	}
}

/**
 * If player is dead
 */
function die() {
	//If hes already dead -> do nothing
	if (!alive) return;

	//Set alive to false
	alive = false;

	//Make screen black and white to signal death
	document.querySelector('canvas').classList.add('c-died');

	//Hide player
	player.setActive(false);
	player.setVisible(false);

	/**
	 * If multiplayer send status update
	 */
	if (multiplayer) {
		mqttClient.publish(
			`afloat/lobby/${lobbyId}/game`,
			JSON.stringify({
				clientId: clientId,
				status: 'died',
				score: score
			})
		);
		//If both players are dead -> End Game
		if (!otherPlayerData.alive) {
			endGame();
		} else {
			document.querySelector('.js-deathscreen-popup__score').innerHTML = score;
			document.querySelector('.js-deathscreen-popup').classList.remove('u-hidden');
		}
		/**
		 * If singleplayer End Game
		 */
	} else {
		endGame();
	}
}

/**
 * Ends the game
 */
const endGame = () => {
	//Adds 1 second delay for ending the game not abruptly
	setTimeout(() => {
		/**
		 * If multiplayer
		 */
		if (multiplayer) {
			//Send scores of both players
			let scores = [
				{
					avatar: avatars.indexOf(avatar),
					score: score,
					offlinePlayer: true
				},
				{
					avatar: avatars.indexOf(otherPlayerData.avatar),
					score: otherPlayerData.score !== undefined ? otherPlayerData.score : score,
					offlinePlayer: false
				}
			];
			//Sort the scores
			scores.sort(function(a, b) {
				return b.score - a.score;
			});

			//Show results page
			showResults(scores);

			//Reset all variables for next game
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
			connectedCloud = false;

			//Disconnect from lobby and Mqtt lobbies
			endGameLobby();
			mqttClient.unsubscribe(`afloat/lobby/${lobbyId}/game`);

			document.querySelector('.js-deathscreen-popup').classList.add('u-hidden');

			/**
			 * If singleplayer
			 */
		} else {
			//Show results of player
			showResults([
				{
					avatar: avatars.indexOf(avatar),
					score: score,
					offlinePlayer: true
				}
			]);

			//Set lobby number to 1
			document.querySelectorAll('.js-lobby-menu-id').forEach(el => {
				el.innerHTML = '1';
			});
		}

		if (leaderboard !== undefined && leaderboard.length >= 5) {
			if (score > leaderboard[4].score) {
				showLeaderBoardPopup();
			}
		} else {
			showLeaderBoardPopup();
		}

		//Stop the theme song
		music.stop();

		//Remove resize listener
		window.removeEventListener('resize', resize);
		window.removeEventListener('deviceorientation', processGyro);

		//Hide game layer
		document.querySelector('.js-game').classList.add('u-hidden');
		//Show results page
		document.querySelector('.js-main__results').classList.remove('u-hidden');

		//Stop game scene
		currentScene.scene.stop();

		//Set started to False
		started = false;

		//Reset hearts
		healthObjects.forEach(el => {
			el.classList.remove('c-game-overlay__heart--dead');
		});

		//Set alive back to true
		alive = true;
		//Set health back to 3
		health = 3;
		host = true;
		//Reset score object
		scoreObject.innerHTML = 0;

		//Remove black and white death filter
		document.querySelector('canvas').classList.remove('c-died');
	}, 1000);
};

/**
 * To disconnect from a multiplayer game
 */
const disconnectMultiplayer = () => {
	mqttClient.publish(
		`afloat/lobby/${lobbyId}/game`,
		JSON.stringify({
			clientId: clientId,
			status: 'disconnect'
		})
	);
};

/**
 * Start the game
 */
const startGame = () => {
	//Set correct highscore from the leaderboard
	document.querySelector('.js-game__loader').classList.add('u-hidden');
	document.querySelector('.js-game').classList.remove('u-hidden');
	//Set countdown
	let countdown = 10;

	let countdownInterval;

	//Setup countdown interval
	countdownInterval = setInterval(() => {
		/**
		 * If 0 -> Start the game
		 */
		if (countdown == 0) {
			countdownWrapperObject.innerHTML = '';

			clearInterval(countdownInterval);
			started = true;
			/**
			 * If not 0 -> count down
			 */
		} else {
			countdownWrapperObject.innerHTML = `<h1 class="c-game-overlay__countdown js-countdown">${countdown}</h1>`;

			/**
			 * Add zoom effect
			 */
			setTimeout(() => {
				let countdownObject = document.querySelector('.js-countdown');
				countdownObject.classList.add('c-game-overlay__countdown--big');
			}, 100);

			countdown--;
		}
	}, 1000);
};

/**
 * Initialises a new game (~THIS DOES NOT START IT~)
 * @param {int} avatarid
 * @param {boolean} multiplayerBool
 */
const initialiseNewGame = (currentPlayer, otherPlayer = undefined, multiplayerBool = false) => {
	//Set multiplayer variable
	document.querySelector('.js-game__loader').classList.remove('u-hidden');

	if (host) console.warn('Starting game as host');
	else console.warn('Starting game as slave');
	multiplayer = multiplayerBool;

	//Set score back to 0
	score = 0;

	//Set correct avatar
	avatar = avatars[currentPlayer.avatar];

	//Start the game scene
	game.scene.start('game');

	/**
	 * If singleplayer -> Start the game immediately
	 * else -> wait for the other player to join
	 */

	if (multiplayer) {
		//Set the correct avatar
		otherPlayerData.avatar = avatars[otherPlayer.avatar];
	}
};

/**
 * Return relative (normalized) x,y coords
 * @param {double} xb
 * @param {double} yb
 */
const getNormalizedPositions = (xb, yb) => {
	let x = ((xb - (width - boundingWidth * 0.85) / 2) / boundingWidth) * 100;
	let y = (yb / boundingHeight) * 100;
	return [x, y];
};

/**
 * Return absolute x,y coords
 * @param {double} xb
 * @param {double} yb
 */
const getRealPositions = (xb, yb) => {
	let x = (xb / 100) * boundingWidth + (width - boundingWidth * 0.85) / 2;
	let y = (yb / 100) * boundingHeight;
	return [x, y];
};

/**
 * Calculate width and height based on device pixel ratio
 */
const calcWidthHeight = () => {
	const dpr = window.devicePixelRatio;
	let width = window.innerWidth > window.innerHeight ? window.innerWidth * dpr : window.innerHeight * dpr;
	let height = window.innerWidth > window.innerHeight ? window.innerHeight * dpr : window.innerWidth * dpr;
	return [width, height];
};

/**
 * Return Gamebounds based on 16:9 aspect ratio
 * @param {double} height
 */
const calcGameBounds = height => {
	console.log(Math.abs(window.innerWidth - window.innerHeight));
	console.log(window.innerHeight * 0.4);
	if (Math.abs(window.innerWidth - window.innerHeight) > window.innerHeight * 0.75) {
		return [height * 1.77, height];
	} else {
		return [width, height];
	}
};

/**
 * On resize
 */
const resize = () => {
	if (multiplayer) {
		disconnectMultiplayer();
		leaveLobby();
	}
	location.reload();
};

/**
 * Create game object
 */
const initGame = () => {
	[width, height] = calcWidthHeight();

	[boundingWidth, boundingHeight] = calcGameBounds(height);
	gravity = height;

	let config = {
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
				debug: false
			}
		}
	};
	game = new Phaser.Game(config);

	//Add game scene
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

/**
 * Initialises the framework
 */
const initFramework = () => {
	document.documentElement.style.setProperty('--page-width', window.innerWidth + 'px');
	document.documentElement.style.setProperty('--page-height', window.innerHeight + 'px');
	/**
	 * Event when page gets closed
	 */
	window.addEventListener('beforeunload', () => {
		if (isLoadingGame || started) {
			if (currentScene != undefined) {
				if (multiplayer && connectedCloud) {
					disconnectMultiplayer();
					endGame();
				} else {
					endGame();
				}
			}
		}
	});

	/**
	 * Event when user switches to another tab
	 */
	window.addEventListener('blur', () => {
		if (isLoadingGame || started) {
			if (currentScene != undefined) {
				if (multiplayer && connectedCloud) {
					disconnectMultiplayer();
					endGame();
				} else {
					endGame();
				}
			}
		}
	});

	/**
	 * Mute toggle
	 */

	document.querySelector('.js-mute-toggle').addEventListener('input', el => {
		if ((currentScene !== undefined || isLoadingGame) && music !== undefined) {
			if (el.target.checked) {
				music.stop();
			} else {
				music.play();
			}
		}
	});

	let lastTimeResize = new Date().getTime();
	window.addEventListener('resize', e => {
		// if (!document.querySelector('.js-main__score-results').classList.contains('u-hidden')) {
		// 	e.preventDefault();
		// }
		if (!document.querySelector('.js-fullscreen').classList.contains('u-hidden') || !document.querySelector('.js-turnpage').classList.contains('u-hidden')) {
			document.documentElement.style.setProperty('--page-width', window.innerWidth + 'px');
			document.documentElement.style.setProperty('--page-height', window.innerHeight + 'px');
		}
		// if (!document.querySelector('.js-main__score-results').classList.contains('u-hidden') && new Date().getTime() - lastTimeResize > 1000) {
		// 	if (keyboardOpen) {
		// 		document.querySelector('.js-scoreboard-popup').classList.remove('js-scoreboard-popup--open');
		// 		keyboardOpen = false;
		// 	} else {
		// 		keyboardOpen = true;
		// 	}
		// 	lastTimeResize = new Date().getTime();
		// }
		let iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
		if (iOS) {
			if (
				isFullscreen &&
				document.fullscreenElement !== null &&
				document.querySelector('.js-fullscreen').classList.contains('u-hidden') &&
				document.querySelector('.js-main__score-results').classList.contains('u-hidden') &&
				document.querySelector('.js-main__scoreboard').classList.contains('u-hidden')
			) {
				// alert('reloading resize');
				location.reload();
			} else {
			}
		}
	});

	window.addEventListener('orientationchange', () => {
		orientationCheck();
	});
	orientationCheck();

	//Setup DOM objects
	scoreObject = document.querySelector('.js-current-score');
	highscoreScoreObject = document.querySelector('.js-highscore__score');

	highscorePositionObject = document.querySelector('.js-highscore__position');

	healthObjects = document.querySelectorAll('.js-health-heart');
	countdownWrapperObject = document.querySelector('.js-countdown-wrapper');

	/**
	 * When user clicks go to fullscreen
	 */
	document.body.addEventListener(
		'click',
		() => {
			if (!isFullscreen && !document.querySelector('.js-fullscreen').classList.contains('u-hidden')) {
				/**
				 * Setup fullscreen
				 */
				let iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
				try {
					if (!iOS) {
						if (document.documentElement.requestFullscreen) {
							document.documentElement.requestFullscreen();
						} else if (document.documentElement.msRequestFullscreen) {
							document.documentElement.msRequestFullscreen();
						} else if (document.documentElement.mozRequestFullScreen) {
							document.documentElement.mozRequestFullScreen();
						} else if (document.documentElement.webkitRequestFullscreen) {
							document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
						}
					}
				} catch (ex) {
					console.error(ex);
				} finally {
					try {
						if (document.addEventListener) {
							document.addEventListener('fullscreenchange', exitHandler, false);
							document.addEventListener('mozfullscreenchange', exitHandler, false);
							document.addEventListener('MSFullscreenChange', exitHandler, false);
							document.addEventListener('webkitfullscreenchange', exitHandler, false);
						}
					} catch (ex) {}
					/**
					 * Disable screen sleeping
					 */
					noSleep.enable();

					// Set fullscreen to true
					isFullscreen = true;

					/**
					 * Initialise game object
					 */
					setTimeout(() => {
						document.querySelector('.js-main__start').classList.remove('u-hidden');
						document.querySelector('.js-fullscreen').classList.add('u-hidden');

						document.documentElement.style.setProperty('--page-width', window.innerWidth + 'px');
						document.documentElement.style.setProperty('--page-height', window.innerHeight + 'px');
						if (!iOS) {
							/**
							 * Request landscape mode
							 */
							try {
								screen.orientation.lock('landscape-primary');
							} catch (ex) {}
							try {
								ScreenOrientation.lock('landscape-primary');
							} catch (ex) {}
							try {
								screen.msLockOrientation.lock('landscape-primary');
							} catch (ex) {}
							try {
								screen.mozLockOrientation.lock('landscape-primary');
							} catch (ex) {}
						}
					}, 500);
					setTimeout(() => {
						initGame();
					}, 1500);
					/**
					 * Request gyroscope permission for iOS users
					 */
					try {
						if (typeof DeviceMotionEvent.requestPermission === 'function') {
							DeviceMotionEvent.requestPermission()
								.then(response => {
									if (response == 'granted') {
									}
								})
								.catch(console.error);
						}
					} catch (ex) {}
				}
			}
		},
		true
	);
};

document.addEventListener('DOMContentLoaded', () => {
	initFramework();
});

function orientationCheck() {
	if (game !== undefined) {
		if (window.orientation == 0 || window.orientation == 180) {
			location.reload();
		}
	}
	if (window.orientation == 90 || window.orientation == -90) {
		if (isFullscreen) {
			document.querySelector('.js-main__start').classList.remove('u-hidden');
			document.querySelector('.js-turnpage').classList.add('u-hidden');
		} else {
			document.querySelector('.js-fullscreen').classList.remove('u-hidden');
			document.querySelector('.js-turnpage').classList.add('u-hidden');
		}
	} else {
		if (!document.querySelector('.js-main__start').classList.contains('u-hidden') || !document.querySelector('.js-fullscreen').classList.contains('u-hidden')) {
			document.querySelector('.js-main__start').classList.add('u-hidden');
			document.querySelector('.js-turnpage').classList.remove('u-hidden');
			document.querySelector('.js-fullscreen').classList.add('u-hidden');
		} else {
			location.reload();
		}
	}
}
function exitHandler() {
	if (isFullscreen && (document.fullscreenElement === null || ShadowRoot.fullscreenElement === null) && document.querySelector('.js-fullscreen').classList.contains('u-hidden')) {
		isFullscreen = false;
		console.log('Disabled fullscreen');

		if (isLoadingGame || started) {
			if (currentScene != undefined) {
				if (multiplayer && connectedCloud) {
					disconnectMultiplayer();
					endGame();
				} else {
					endGame();
				}
			}
		}
	}
}
