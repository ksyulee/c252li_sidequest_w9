/*
  Week 9 — Example 3: Adding Sound & Music

  Course: GBDA302 | Instructors: Dr. Karen Cochrane & David Han
  Date: Mar. 19, 2026

  Controls:
    A or D (Left / Right Arrow)   Horizontal movement
    W (Up Arrow)                  Jump
    Space Bar                     Attack

  Debug Controls:
    `                              Toggle debug menu
    1                              Toggle moon gravity
    2                              Toggle hitboxes
    3                              Toggle invincibility

  Tile key:
    g = groundTile.png       (surface ground)
    d = groundTileDeep.png   (deep ground, below surface)
      = empty (no sprite)
*/

let player;
let sensor;
let playerImg, bgImg;
let jumpSfx, musicSfx;
let musicStarted = false;

let playerAnis = {
  idle: { row: 0, frames: 4, frameDelay: 10 },
  run: { row: 1, frames: 4, frameDelay: 3 },
  jump: { row: 2, frames: 3, frameDelay: Infinity, frame: 0 },
  attack: { row: 3, frames: 6, frameDelay: 2 },
};

let ground, groundDeep;
let groundImg, groundDeepImg;

let attacking = false;
let attackFrameCounter = 0;

// --- DEBUG ---
let debugMenuOpen = false;
let moonGravity = false;
let showDebugBoxes = false;
let playerInvincible = false;

const NORMAL_GRAVITY = 10;
const MOON_GRAVITY = 2.2;

// --- TILE MAP ---
let level = [
  "              ",
  "              ",
  "              ",
  "              ",
  "              ",
  "       ggg    ",
  "gggggggggggggg",
  "dddddddddddddd",
];

// --- LEVEL CONSTANTS ---
const VIEWW = 320,
  VIEWH = 180;

const TILE_W = 24,
  TILE_H = 24;

const FRAME_W = 32,
  FRAME_H = 32;

const MAP_START_Y = VIEWH - TILE_H * 4;

function preload() {
  // --- IMAGES ---
  playerImg = loadImage("assets/foxSpriteSheet.png");
  bgImg = loadImage("assets/combinedBackground.png");
  groundImg = loadImage("assets/groundTile.png");
  groundDeepImg = loadImage("assets/groundTileDeep.png");

  // --- SOUND ---
  if (typeof loadSound === "function") {
    jumpSfx = loadSound("assets/sfx/jump.wav");
    musicSfx = loadSound("assets/sfx/music.wav");
  }
}

function setup() {
  // pixelated rendering with autoscaling
  new Canvas(VIEWW, VIEWH, "pixelated");

  // needed to correct visual artifacts from attempted antialiasing
  allSprites.pixelPerfect = true;

  world.gravity.y = NORMAL_GRAVITY;

  // Try to start background music immediately
  if (musicSfx) musicSfx.setLoop(true);
  startMusicIfNeeded();

  // --- TILE GROUPS ---
  ground = new Group();
  ground.physics = "static";
  ground.img = groundImg;
  ground.tile = "g";

  groundDeep = new Group();
  groundDeep.physics = "static";
  groundDeep.img = groundDeepImg;
  groundDeep.tile = "d";

  // Create level from tile map
  new Tiles(level, 0, 0, TILE_W, TILE_H);

  // --- PLAYER ---
  player = new Sprite(FRAME_W, MAP_START_Y, FRAME_W, FRAME_H);
  player.spriteSheet = playerImg;
  player.rotationLock = true;

  // Player animation parameters
  player.anis.w = FRAME_W;
  player.anis.h = FRAME_H;
  player.anis.offset.y = -4;
  player.addAnis(playerAnis);
  player.ani = "idle";

  // Collision box
  player.w = 18;
  player.h = 20;
  player.friction = 0;
  player.bounciness = 0;

  // --- GROUND SENSOR ---
  sensor = new Sprite();
  sensor.x = player.x;
  sensor.y = player.y + player.h / 2;
  sensor.w = player.w;
  sensor.h = 2;
  sensor.mass = 0.01;
  sensor.removeColliders();
  sensor.visible = false;

  let sensorJoint = new GlueJoint(player, sensor);
  sensorJoint.visible = false;

  // --- DEBUG VISUALS ---
  player.debug = false;
  sensor.debug = false;
}

function startMusicIfNeeded() {
  if (musicStarted || !musicSfx) return;

  const startLoop = () => {
    if (!musicSfx.isPlaying()) musicSfx.play();
    musicStarted = musicSfx.isPlaying();
  };

  const maybePromise = userStartAudio();
  if (maybePromise && typeof maybePromise.then === "function") {
    maybePromise.then(startLoop).catch(() => {});
  } else {
    startLoop();
  }
}

function keyPressed() {
  startMusicIfNeeded();

  // Toggle debug menu
  if (key === "`") {
    debugMenuOpen = !debugMenuOpen;
  }

  if (debugMenuOpen) {
    if (key === "1") {
      moonGravity = !moonGravity;
      world.gravity.y = moonGravity ? MOON_GRAVITY : NORMAL_GRAVITY;
    }

    if (key === "2") {
      showDebugBoxes = !showDebugBoxes;
      player.debug = showDebugBoxes;
      sensor.debug = showDebugBoxes;
    }

    if (key === "3") {
      playerInvincible = !playerInvincible;
    }
  }
}

function mousePressed() {
  startMusicIfNeeded();
}

function touchStarted() {
  startMusicIfNeeded();
  return false;
}

function drawDebugMenu() {
  camera.off();

  push();
  fill(0, 180);
  noStroke();
  rect(14, 14, 210, 112, 8);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(12);
  text("DEBUG MENU", 24, 24);

  textSize(10);
  text("`  Toggle Menu", 24, 44);
  text("1  Moon Gravity: " + (moonGravity ? "ON" : "OFF"), 24, 60);
  text("2  Show Hitboxes: " + (showDebugBoxes ? "ON" : "OFF"), 24, 76);
  text("3  Invincibility: " + (playerInvincible ? "ON" : "OFF"), 24, 92);
  pop();

  camera.on();
}

function drawDebugStats(grounded) {
  camera.off();

  push();
  fill(255);
  textAlign(LEFT, TOP);
  textSize(10);

  text("x: " + nf(player.x, 1, 1), 10, VIEWH - 42);
  text("y: " + nf(player.y, 1, 1), 10, VIEWH - 32);
  text("vx: " + nf(player.vel.x, 1, 2), 10, VIEWH - 22);
  text("vy: " + nf(player.vel.y, 1, 2), 10, VIEWH - 12);

  text("grounded: " + grounded, 100, VIEWH - 42);
  text("attacking: " + attacking, 100, VIEWH - 32);
  text("gravity: " + world.gravity.y, 100, VIEWH - 22);

  let currentAni = typeof player.ani === "string" ? player.ani : player.ani.name;
  text("ani: " + currentAni, 100, VIEWH - 12);

  pop();

  camera.on();
}

function draw() {
  // --- BACKGROUND ---
  camera.off();
  imageMode(CORNER);
  image(bgImg, 0, 0, bgImg.width, bgImg.height);
  camera.on();

  // --- PLAYER CONTROLS ---
  let grounded = sensor.overlapping(ground);

  // Keep debug visuals synced
  player.debug = showDebugBoxes;
  sensor.debug = showDebugBoxes;

  // -- ATTACK INPUT --
  if (grounded && !attacking && kb.presses("space")) {
    attacking = true;
    attackFrameCounter = 0;
    player.vel.x = 0;
    player.ani.frame = 0;
    player.ani = "attack";
    player.ani.play();
  }

  // -- JUMP --
  if (grounded && kb.presses("up")) {
    player.vel.y = -4;
    if (jumpSfx) jumpSfx.play();
  }

  // --- STATE MACHINE ---
  if (attacking) {
    attackFrameCounter++;
    if (attackFrameCounter > 12) {
      attacking = false;
      attackFrameCounter = 0;
    }
  } else if (!grounded) {
    player.ani = "jump";
    player.ani.frame = player.vel.y < 0 ? 0 : 1;
  } else {
    player.ani = kb.pressing("left") || kb.pressing("right") ? "run" : "idle";
  }

  // --- MOVEMENT ---
  if (!attacking) {
    player.vel.x = 0;

    if (kb.pressing("left") || kb.pressing("a")) {
      player.vel.x = -1.5;
      player.mirror.x = true;
    } else if (kb.pressing("right") || kb.pressing("d")) {
      player.vel.x = 1.5;
      player.mirror.x = false;
    }
  }

  // --- KEEP IN VIEW ---
  player.pos.x = constrain(player.pos.x, FRAME_W / 2, VIEWW - FRAME_W / 2);

  // Example placeholder for future damage logic:
  // if (!playerInvincible) {
  //   // apply damage here
  // }

  // --- DEBUG UI ---
  if (debugMenuOpen) {
    drawDebugMenu();
    drawDebugStats(grounded);
  }
}