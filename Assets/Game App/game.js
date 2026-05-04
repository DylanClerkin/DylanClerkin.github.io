const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');

// Load Images 
const playerImg = new Image();
playerImg.src = 'player.png'; 

const platformImg = new Image();
platformImg.src = 'platform.png'; 

const spikeImg = new Image();
spikeImg.src = 'spike.png'; 

// Game Variables
let score = 0;
let gameOver = false;
const gravity = 0.4;
const friction = 0.8;
const bounce = -10;

const player = { x: 200, y: 400, width: 30, height: 30, dx: 0, dy: 0 };
let platforms = [];
let obstacles = []; 

const keys = { ArrowLeft: false, ArrowRight: false };

window.addEventListener('keydown', (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; });
window.addEventListener('keyup', (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

function createStartingPlatforms() {
    platforms = [];
    obstacles = [];
    
    // The starting platform is already marked as scored
    platforms.push({ x: 150, y: 550, width: 60, height: 15, scored: true });
    
    for (let i = 0; i < 6; i++) {
        let x = Math.random() * (canvas.width - 60);
        let y = 500 - (i * 90);
        platforms.push({ x: x, y: y, width: 60, height: 15, scored: false });
    }
}

function update() {
    if (gameOver) return;

    // Movement & Physics
    if (keys.ArrowLeft) player.dx -= 1;
    if (keys.ArrowRight) player.dx += 1;
    player.dx *= friction;
    player.dy += gravity;
    player.x += player.dx;
    player.y += player.dy;

    // Screen Wrap
    if (player.x > canvas.width) player.x = -player.width;
    if (player.x + player.width < 0) player.x = canvas.width;

    // Platform Collision (Bounce & Score)
    if (player.dy > 0) {
        platforms.forEach(platform => {
            if (player.x < platform.x + platform.width &&
                player.x + player.width > platform.x &&
                player.y + player.height > platform.y &&
                player.y + player.height < platform.y + platform.height + player.dy) {
                
                player.dy = bounce; // Bounce

                // Scoring Logic
                if (!platform.scored) {
                    score++;
                    scoreDisplay.innerText = score;
                    platform.scored = true; // Mark as scored so they can't farm points
                }
            }
        });
    }

    // Obstacle Collision (Game Over)
    obstacles.forEach(obs => {
        if (player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y) {
            gameOver = true;
            alert("You hit a spike! Score: " + score + "\nRefresh to play again.");
        }
    });

    // Camera/Scrolling Logic
    if (player.y < canvas.height / 2) {
        player.y = canvas.height / 2; 

        // Move platforms down
        platforms.forEach(platform => {
            platform.y -= player.dy; 
            
            if (platform.y > canvas.height) {
                platform.y = 0;
                platform.x = Math.random() * (canvas.width - platform.width);
                platform.scored = false; // Reset the score flag for the new platform

                // OBSTACLE SPAWN LOGIC: 30% chance
                if (Math.random() < 0.30) {
                    obstacles.push({
                        x: platform.x + 20, 
                        y: platform.y - 20, 
                        width: 20,
                        height: 20
                    });
                }
            }
        });

        // Move obstacles down with the camera
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].y -= player.dy;
            
            if (obstacles[i].y > canvas.height) {
                obstacles.splice(i, 1);
            }
        }
    }

    // Game Over condition (Falling)
    if (player.y > canvas.height) {
        gameOver = true;
        alert("You fell! Score: " + score + "\nRefresh to play again.");
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Platforms 
    platforms.forEach(platform => {
        if (platformImg.complete && platformImg.naturalHeight !== 0) {
            ctx.drawImage(platformImg, platform.x, platform.y, platform.width, platform.height);
        } else {
            ctx.fillStyle = '#27ae60'; 
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
    });

    // Draw Obstacles 
    obstacles.forEach(obs => {
        if (spikeImg.complete && spikeImg.naturalHeight !== 0) {
            ctx.drawImage(spikeImg, obs.x, obs.y, obs.width, obs.height);
        } else {
            ctx.fillStyle = '#8e44ad'; 
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
    });

    // Draw Player
    if (playerImg.complete && playerImg.naturalHeight !== 0) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = '#e74c3c'; 
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop); 
}

createStartingPlatforms();
loop();