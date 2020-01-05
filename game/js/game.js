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

var alive = true;
var currentScene;

var pengiun;
var enemies;

/**
 * Game life cycles
 */

function preload() {
	this.load.image('bg', 'assets/bg.png');
	this.load.image('platform', 'assets/block_snow_1_mid_3@3x.png');
	// this.load.image('platform', 'assets/.png');

	this.load.image('player', 'assets/player.png');
}

function create() {
	currentScene = this;
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

	// platform = this.add.rectangle(width / 2, height - height * 0.05, boundingWidth * 0.85, boundingHeight * 0.1, 0xff0000);
	// platforms.add(platform);

	// var container = this.add.container(width / 2, height - height * 0.05);

	let sprite = this.add.image((width - boundingWidth * 0.85) / 2, height - height * 0.099, 'platform');
	// sprite.displayWidth = boundingWidth;
	sprite.setOrigin(1, 0);
	sprite.displayHeight = boundingHeight * 0.1;

	sprite.scaleY = sprite.scaleX = boundingWidth / 2000;

	// var shape = this.make.graphics();

	// shape.fillStyle(0xffffff);

	// shape.beginPath();

	// shape.fillRect((width - boundingWidth * 0.85) / 2, 0, boundingWidth * 0.85, boundingHeight);
	// var mask = shape.createGeometryMask();

	// sprite.setMask(mask);

	ts = this.add.tileSprite(width / 2, height - height * 0.05, boundingWidth * 0.85, boundingHeight * 0.1, 'platform');
	ts.tileScaleX = boundingWidth / 2000;
	ts.tileScaleY = boundingWidth / 2000;
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

	/**
	 * Sliding object
	 */

	enemies = [];

	pengiun = this.physics.add.sprite((width - boundingWidth * 0.85) / 2, height - height * 0.2, 'player');
	pengiun.scaleY = pengiun.scaleX = boundingWidth / 3000;

	this.physics.add.existing(pengiun);
	pengiun.setDepth(10);
	pengiun.body.bounce.x = 0.2;
	pengiun.body.bounce.y = 0.2;
	pengiun.body.setCollideWorldBounds = true;
	this.physics.add.collider(pengiun, platforms);
	enemies.push(pengiun);

	/**
	 * Falling object
	 */
	ice = this.physics.add.sprite(width / 2, 0, 'player');
	ice.scaleY = ice.scaleX = boundingWidth / 3000;

	this.physics.add.existing(ice);
	ice.setDepth(10);
	ice.body.bounce.x = 0.2;
	ice.body.bounce.y = 0.2;
	// ice.body.setCollideWorldBounds = true;
	// this.physics.add.collider(ice, platforms);
	enemies.push(ice);

	this.physics.add.overlap(player, enemies, die, null, this);

	/**
	 * Click event
	 */
	this.input.on(
		'pointerup',
		function(pointer) {
			if (this.scale.isFullscreen) {
				this.scale.stopFullscreen();
				noSleep.disable();
				// On stop fulll screen
			} else {
				this.scale.startFullscreen();
				noSleep.enable();
				// On start fulll screen
			}
			screen.orientation.lock('landscape-primary');
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
						player.body.velocity.x = boundingWidth * -0.1;
					} else if (data.do.beta < -15) {
						player.body.velocity.x = boundingWidth * 0.1;
					} else {
						player.body.velocity.x = 0;
					}
					text.setText(data.do.beta);
				} else if (window.orientation === 90) {
					if (data.do.beta > 15) {
						player.body.velocity.x = boundingWidth * 0.1;
					} else if (data.do.beta < -15) {
						player.body.velocity.x = boundingWidth * -0.1;
					} else {
						player.body.velocity.x = 0;
					}
					text.setText(data.do.beta);
				} else {
					if (data.do.gamma > 15) {
						player.body.velocity.x = boundingWidth * 0.1;
					} else if (data.do.gamma < -15) {
						player.body.velocity.x = boundingWidth * -0.1;
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
	pengiun.body.velocity.x = width * 0.15;
}

/**
 * Game Utility functions
 */

function die() {
	console.warn('YOU DIED');
	document.querySelector('canvas').classList.add('died');
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
