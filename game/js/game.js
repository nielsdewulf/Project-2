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

/**
 * Game life cycles
 */

function preload() {
	this.load.image('bg', 'assets/bg.png');
	this.load.image('platform', 'assets/platform.png');
}

function create() {
	currentScene = this;
	[width, height] = calcWidthHeight();

	[boundingWidth, boundingHeight] = calcGameBounds(height);

	window.removeEventListener('resize', resize);
	window.addEventListener('resize', resize);

	this.scale.setGameSize(width, height);

	let bg = this.add.image(width / 2, height - height / 2, 'bg');
	bg.displayWidth = width;
	bg.scaleY = bg.scaleX;

	platforms = this.physics.add.staticGroup();

	// platform = this.add.rectangle(width / 2, height - height * 0.05, boundingWidth * 0.85, boundingHeight * 0.1, 0xff0000);
	// platforms.add(platform);

	let sprite = this.add.image(width / 2, height - height * 0.02, 'platform');
	sprite.displayWidth = width;
	sprite.scaleY = sprite.scaleX;

	var shape = this.make.graphics();

	shape.fillStyle(0xffffff);

	shape.beginPath();

	shape.fillRect((width - boundingWidth * 0.85) / 2, height - height * 0.08, boundingWidth * 0.85, boundingHeight);
	var mask = shape.createGeometryMask();

	sprite.setMask(mask);

	platforms.add(sprite);

	// let image = platforms.create(width / 2, height - height * 0.05, 'platform');
	// image.width = boundingWidth * 0.85;
	// image.height = boundingHeight * 0.1;
}

function update() {}

/**
 * Game Utility functions
 */

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
