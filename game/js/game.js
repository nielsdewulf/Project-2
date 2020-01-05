var clientId = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));

var width, height;

var boundingWidth, boundingHeight;

var screenangle = window.orientation;

var gyroscope = true;
var noSleep = new NoSleep();

var client;

var connectedCloud = false;

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

/**
 * Game life cycles
 */

function preload() {
	this.load.image('bg', 'assets/bg.png');
	this.load.image('platform', 'assets/block_snow_1_mid_3@3x.png');
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
	let bg = this.add.image(width / 2, height - height / 2, 'bg');
	bg.displayWidth = width > height ? width : height;
	bg.scaleY = bg.scaleX;

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

	let sprite = this.add.tileSprite((width - boundingWidth * 0.55) / 2, height - height * 0.1, (boundingWidth / 1344) * 192, (boundingWidth / 1344) * 192, 'platform');
	// sprite.displayWidth = (boundingWidth / 1344) * 192;
	sprite.tileScaleX = sprite.tileScaleY = boundingWidth / 1348;
	// ts.tileScaleY = boundingWidth / 1354;
	sprite.setOrigin(1, 0);
	// spritexd.displayHeight = boundingHeight * 0.1;

	// spritexd.scaleY = spritexd.scaleX = boundingWidth / 1344;
	platforms.add(sprite);

	/**
	 * Right platform edge
	 */
	let spritexd = this.add.tileSprite((width - boundingWidth * 0.55) / 2 + boundingWidth * 0.55 - 0.5, height - height * 0.1, (boundingWidth / 1344) * 192, (boundingWidth / 1344) * 192, 'platform');
	// sprite.displayWidth = (boundingWidth / 1344) * 192;
	spritexd.tileScaleX = spritexd.tileScaleY = boundingWidth / 1400;
	// ts.tileScaleY = boundingWidth / 1354;
	spritexd.setOrigin(0, 0);
	// spritexd.displayHeight = boundingHeight * 0.1;

	// spritexd.scaleY = spritexd.scaleX = boundingWidth / 1344;
	platforms.add(spritexd);

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
	ts = this.add.tileSprite(width / 2, height - height * 0.05, boundingWidth * 0.55, boundingHeight * 0.1, 'platform');
	ts.tilePositionX = 0;
	ts.tilePositionY = 0;
	ts.tileScaleX = boundingWidth / 1400;
	ts.tileScaleY = boundingWidth / 1400;
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
				player.body.velocity.y = 600 - -1 * ((boundingHeight / 1080) * 1200);
			}
		},
		this
	);

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
					if (data.do.beta > 15) {
						player.body.velocity.x = boundingWidth * -0.3;
					} else if (data.do.beta < -15) {
						player.body.velocity.x = boundingWidth * 0.3;
					} else {
						player.body.velocity.x = 0;
					}
					text.setText(data.do.beta);
				} else if (window.orientation === 90) {
					if (data.do.beta > 15) {
						player.body.velocity.x = boundingWidth * 0.3;
					} else if (data.do.beta < -15) {
						player.body.velocity.x = boundingWidth * -0.3;
					} else {
						player.body.velocity.x = 0;
					}
					text.setText(data.do.beta);
				} else {
					if (data.do.gamma > 15) {
						player.body.velocity.x = boundingWidth * 0.3;
					} else if (data.do.gamma < -15) {
						player.body.velocity.x = boundingWidth * -0.3;
					} else {
						player.body.velocity.x = 0;
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
	// penguin.body.velocity.x = width * 0.15;
	penguinsLEFT.forEach((el, i) => {
		el.body.velocity.x = width * 0.15 * -1;
	});
	penguinsRIGHT.forEach((el, i) => {
		el.body.velocity.x = width * 0.15;
	});
	let random = Math.random() * (8000 - 15000) + 8000;
	if (new Date().getTime() - lastTimeSpawn > random) {
		console.log(new Date().getTime() - lastTimeSpawn, random);
		if (Math.random() > 0.2) {
			console.warn('RESPAWNING');
			if (Math.random() <= 0.8) {
				/**
				 * Spawn icicle
				 */
				console.error(width - (boundingWidth * 0.55) / 2, width - boundingWidth * 0.85 + boundingWidth);
				let x =
					Math.random() * (((width - boundingWidth * 0.85) / 2 + boundingWidth * 0.85) * icicleConfig.maxSpawnOffset - (width - boundingWidth * 0.85) / 2) * icicleConfig.minSpawnOffset +
					((width - boundingWidth * 0.85) / 2) * icicleConfig.minSpawnOffset;

				ice = this.physics.add.sprite(x, -1 * (boundingHeight * 0.4), 'icicle');
				ice.scaleY = ice.scaleX = boundingWidth / 4000;

				this.physics.add.existing(ice);
				ice.setDepth(500);
				ice.body.bounce.x = 0.2;
				ice.body.bounce.y = 0.2;
				// ice.body.setCollideWorldBounds = true;
				// this.physics.add.collider(ice, platforms);
				enemies.push(ice);
			} else {
				/**
				 * Spawn penguin
				 */
				let x;
				let list;
				let flip = true;
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

				this.physics.add.existing(penguin);
				penguin.setDepth(1000);
				penguin.body.bounce.x = 0.5;
				penguin.body.bounce.y = 0.5;
				penguin.body.setCollideWorldBounds = true;
				this.physics.add.collider(penguin, platforms);
				enemies.push(penguin);
				list.push(penguin);
			}
		}
		lastTimeSpawn = new Date().getTime();
	}
}

/**
 * Game Utility functions
 */

function die() {
	console.warn('YOU DIED');
	// document.querySelector('canvas').classList.add('died');
}

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
	screen.orientation.lock('landscape-primary');

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
					y: 800
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
