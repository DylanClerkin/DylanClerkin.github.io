const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const highScoreDisplay = document.getElementById('highScoreDisplay'); // NEW

// Load Images 
const playerImg = new Image();
playerImg.src = 'player.png'; 

const platformImg = new Image();
platformImg.src = 'platform.png'; 

const spikeImg = new Image();
spikeImg.src = 'spike.png'; 

// Game Variables
let score = 0;
// NEW: Get high score from local storage (or default to 0 if it doesn't exist)
let highScore = localStorage.getItem('climberHighScore') || 0; 
highScoreDisplay.innerText = highScore;

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
    
    platforms.push({ x: 150, y: 550, width: 60, height: 15, scored: true });
    
    for (let i = 0; i < 6; i++) {
        let x = Math.random() * (canvas.width - 60);
        let y = 500 - (i * 90);
        platforms.push({ x: x, y: y, width: 60, height: 15, scored: false });
    }
}

// NEW: Function to handle High Score logic
function handleGameOver(reason) {
    gameOver = true;
    let message = reason + " Score: " + score;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('climberHighScore', highScore); // Save to browser
        message = "NEW HIGH SCORE! 🏆\n" + message;
    }
    
    message += "\nRefresh to play again.";
    alert(message);
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
                
                player.dy = bounce; 

                // Scoring Logic
                if (!platform.scored) {
                    score++;
                    scoreDisplay.innerText = score;
                    platform.scored = true; 
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
            
            // NEW: Use handleGameOver function
            handleGameOver("You hit a spike!");
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
                platform.scored = false; 

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

        // Move obstacles down
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].y -= player.dy;
            
            if (obstacles[i].y > canvas.height) {
                obstacles.splice(i, 1);
            }
        }
    }

    // Game Over condition (Falling)
    if (player.y > canvas.height) {
        // NEW: Use handleGameOver function
        handleGameOver("You fell!");
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