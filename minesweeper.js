// Board
let board;
// TODO: Allow diffrent board sizes in the future
const rowCount = 10;
const columnCount = 10;
const tileSize = 64; // in px
const boardWidth  = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;
let popUp;
let popUpBtn;
let popUpTitle;

// Visuals
const lightTileColor = "#6ad986";
const darkTileColor = "#2c9145";
const lightRevealedTileColor =  "#d99e6a";
const darkRevealedTileColor =  "#915b2c";
const amountMinesColors = ["#1e40af", "#047857", "#e05151", "#6d28d9", "#ec8600", "#0f766e", "#111827", "#881337", "#739cd4"];
let flagImage;
let bombImage;
let falseFlagImage;
const amountExplosionFrames = 4;
let explosionFrames = [];

// Game state
// TODO: Allow diffrent amounts of mines in the future
const amountMines = 20; 
let tiles = [];
let isMinesLoaded = false;
let isGameActive = true;

window.onload = async function() {
    // Wait for the font to load
    await document.fonts.load(`${tileSize}px "Micro 5"`);

    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); // used for drawing on the boardWW

    // Set up pop-up elements
    popUp = document.getElementById("pop-up");
    popUpTitle = document.getElementById("pop-up-title");
    popUpBtn = document.getElementById("pop-up-btn");
    popUpBtn.addEventListener("click", resetGame);

    loadImages();
    initMap();

    draw();
    document.addEventListener("click", analyzeClick);
    document.addEventListener("contextmenu", analyzeClick);
}

function loadImages(){
    flagImage = new Image();
    flagImage.src = "./res/images/flag.png";

    bombImage = new Image();
    bombImage.src = "./res/images/bomb.png";

    falseFlagImage = new Image();
    falseFlagImage.src = "./res/images/false_flag.png";

    // load explosion frames
    for (let i = 1; i <= amountExplosionFrames; i++){
        const frame = new Image();
        frame.src = `./res/images/explosion/frame${i}.png`;
        explosionFrames.push(frame);
    }
}

class Tile {
    constructor(color, x, y, size) {
        this.color = color;
        this.x = x;
        this.y = y;
        this.size = size;

        this.isRevealed = false;
        this.isFlagged = false;
        this.isMine = false;

        // deduced values
        this.revealedColor = color === lightTileColor ? lightRevealedTileColor : darkRevealedTileColor;
        // For animation
        this.explosionFrame = null;
        this.isFalseFlag = false;
    }

    getColor() {
        return this.isRevealed ? this.revealedColor : this.color;
    }
}

function initMap(){
    // Init tiles & assign colors
    for (let r = 0; r < rowCount; r++){
        tiles.push([]);
        for (let c = 0; c < columnCount; c++){
            // Where exactly the tile is going to be printed
            const x = c * tileSize;
            const y = r * tileSize;
            const color = (r+c) % 2 === 0 ? lightTileColor : darkTileColor
            
            const tile = new Tile(color, x, y, tileSize);
            tiles[r].push(tile);
        }
    }
}

/**
 * Generates mines on the board, guaranteeing the first clicked tile
 * and its immediate neighbors are mine-free.
 * Should be called on the first tile click, not during initialization.
 * 
 * @param {number} safeRow - Row index of the first clicked tile
 * @param {number} safeCol - Column index of the first clicked tile
 */
function generateMines(safeRow, safeCol){
    console.log("new game, generating mines..."); // TODO: remove debug log
    let counter = 0;

    while (counter < amountMines) {
        let randRow = Math.floor(Math.random() * rowCount);
        let randCol = Math.floor(Math.random() * columnCount);

        // Check if the tile is one of the 8 neighbors of the safe tile
        let isNeighbor = false;
        for (let dr = -1; dr <= 1; dr++){
            for (let dc = -1; dc <= 1; dc++){
                if (randRow === safeRow + dr && randCol === safeCol + dc){
                    isNeighbor = true;
                    break;
                }
            }
            if (isNeighbor) break;
        }

        if (isNeighbor){
            continue;
        }

        if (!tiles[randRow][randCol].isMine) {
            tiles[randRow][randCol].isMine = true;
            counter++;
            console.log(`Mine generated at (${randRow}, ${randCol})`); // TODO: remove debug log
        }

    }

    isMinesLoaded = true;
}

function resetGame() {
    tiles = [];
    isMinesLoaded = false;
    isGameActive = true;
    initMap();
    
    draw();

    hidePopUp();
}

function draw(){
    // Set-up text
    context.font = `${tileSize}px "Micro 5"`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    for (let r = 0; r < rowCount; r++){
        for (let c = 0; c < columnCount; c++){
            const tile = tiles[r][c];
            context.fillStyle = tile.getColor();
            context.fillRect(tile.x, tile.y, tile.size, tile.size);

            // Draw the flag if needed
            if (tile.isFlagged){
                const flagType = tile.isFalseFlag ? falseFlagImage : flagImage;
                context.drawImage(flagType, tile.x, tile.y)
            }

            // If revealed, either the mine or print the number
            if (tile.isRevealed && tile.isMine){
                context.drawImage(bombImage, tile.x, tile.y);
                if (tile.explosionFrame != null){
                    context.drawImage(explosionFrames[tile.explosionFrame], tile.x, tile.y);
                }
            } else if (tile.isRevealed && !tile.isMine && !tile.isFlagged){
                const countedMines = countMines(r, c);
                if (countedMines != 0){
                    context.fillStyle = amountMinesColors[countedMines - 1];
                    context.fillText(countedMines, tile.x + tileSize/2, tile.y + tileSize/2);
                }
            }
        }
    }
}

function analyzeClick(event){
    event.preventDefault();

    // ignore clicks if game ended
    if (!isGameActive){
        return;
    }

    // if clicked outside the canvas
    if (event.target !== board) {
        return;
    }

    const col = Math.floor(event.offsetX / tileSize);
    const row = Math.floor(event.offsetY / tileSize);

    // On the first click, generate the mines
    if(!isMinesLoaded){
        generateMines(row, col);
    }

    // flag on right click, reveal on left click
    // flag/unflag only if not revealed and reveal only if unflagged
    if (event.type === "contextmenu" && !tiles[row][col].isRevealed){
        tiles[row][col].isFlagged = !tiles[row][col].isFlagged;
    } else if (event.type === "click" && !tiles[row][col].isFlagged){
        reveal(row, col);
        checkLose(row, col);
    }

    // Draw new map
    draw();

    // Check for win
    checkWin();
}

/**
 * Counts the number of mines in the 3x3 grid surrounding the specified tile.
 * @param {number} row 
 * @param {number} col 
 * @returns {number} The total number of mines in the surrounding tiles.
 */
function countMines(row, col){
    let total = 0;
    for (let r = -1; r <= 1; r++){
        for (let c = -1; c<= 1; c++){
            const checkR = row + r;
            const checkC = col + c;
            try {
                total += (tiles[checkR][checkC].isMine) ? 1 : 0;
            } catch {
                // Expected EAFP out of bounds 
            }
        }
    }
    return total;
}

/**
 * Reveals the tile at the specified position and returns the number of revealed tiles.
 * @param {number} row 
 * @param {number} col 
 * @returns {number} The total number of tiles revealed by this action, including the initial tile.
 * If the revealed tile has no adjacent mines, it will recursively reveal all adjacent tiles until it reaches tiles that are adjacent to mines.
 * This function also marks the revealed tiles as revealed in the game state.
 */
function reveal(row, col){
    tiles[row][col].isRevealed = true;
    let total = 1;
    // On empty tile, reveal all tiles beside it
    if (countMines(row, col) === 0){
        for (let r = -1; r <= 1; r++){
            for (let c = -1; c<= 1; c++){
                const newR = row + r;
                const newC = col + c;
                try {
                    // reveal only if not revealed before to avoid infinite loop
                    if (!tiles[newR][newC].isRevealed && !tiles[newR][newC].isFlagged){
                        total += reveal(newR, newC);
                    }
                } catch {
                    // Expected EAFP out of bounds 
                }
            }
        }
    }
    return total;
}

/**
 * A game can be won if:
 * 1) All the mines, and only the mines, are flagged.
 * 2) All the non-mine tiles are revealed.
 */
function checkWin(){
    let minesFlagged = 0;
    let isNonMineFlagged = false;
    let isAllNonMinesRevealed = true;

    for (let r = 0; r < rowCount; r++){
        for (let c = 0; c < columnCount; c++){
            const tile = tiles[r][c];
            if (tile.isMine && tile.isFlagged){
                minesFlagged++;
            } else if (!tile.isMine && tile.isFlagged){
                isNonMineFlagged = true;
            }
            if (!tile.isMine && !tile.isRevealed){
                isAllNonMinesRevealed = false;
            }
        }
    }
    if ((minesFlagged === amountMines && !isNonMineFlagged) || isAllNonMinesRevealed){
        // One big confetti explosion
        confetti({
            particleCount: 300,
            spread: 90,
            startVelocity: 15,
            gravity: 0.7,
            ticks: 300
        })
        
        // A bunch of smaller explosions in random order and random places
        for (let i = 0; i < 10; i++){
            setTimeout(() => {
                confetti({
                        particleCount: 150,
                        spread: 360,
                        startVelocity: 20,
                        gravity: 0.7,
                        origin: {
                            x: Math.random() + 0.1,
                            y: Math.random()
                        },
                        ticks: 300
                        });
            }, i * 250);
        }
        isGameActive = false;
        showPopUp("You Won!");
    }
}

function checkLose(row, col){
    if (tiles[row][col].isMine){
        isGameActive = false;
        // Explode triggering tile immediately
        explode(row, col);
    } else {
        return; // Not a mine
    }

    // Explode the rest of the mines in random order
    for (let r = 0; r < rowCount; r++){
        for (let c = 0; c < columnCount; c++){
            const tile = tiles[r][c];
            // if mine and not revealed and not flagged and not the one that was just clicked
            if (tile.isMine && !tile.isRevealed && !tile.isFlagged && tile !== tiles[row][col]){
                explode(r, c, Math.random() * 1000); // Random delay up to 1 second
            }
        }
    }

    // When all explosions are done, mark false flags
    setTimeout(() => {
        for (let r = 0; r < rowCount; r++){
            for (let c = 0; c < columnCount; c++){
                const tile = tiles[r][c];
                if (!tile.isMine && tile.isFlagged){
                    tile.isRevealed = true;
                    tile.isFalseFlag = true; // No explosion, but we can reuse the property to trigger the false flag image
                }
            }
        }
        draw();
    }, 1500); // Wait a bit longer than the longest explosion animation

    // Reveal pop-up after all explosions are done
    setTimeout(() => {
        showPopUp("You Lost!");
    }, 1600);
}

function explode(row, col, delay = 0){
    // One frame is ~100ms
    setTimeout(() => {
        let tile = tiles[row][col];
        tile.isRevealed = true;
        tile.explosionFrame = 0;

        // Animate explosion
        const explosionInterval = setInterval(() => {
            if (tile.explosionFrame < amountExplosionFrames - 1){
                tile.explosionFrame++;
                draw();
            } else { 
                tile.explosionFrame = null;
                clearInterval(explosionInterval);
                draw();
            }
        }, 100);
    }, delay);
}

function showPopUp(title){
    popUpTitle.textContent = title;
    popUp.classList.remove("hidden");
}

function hidePopUp(){
    popUp.classList.add("hidden");
}