// Board
let board;
// TODO: Allow diffrent board sizes in the future
const rowCount = 10;
const columnCount = 10;
const tileSize = 64; // in px
const boardWidth  = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;

// Visuals
const lightTileColor = "#6ad986";
const darkTileColor = "#2c9145";
const lightRevealedTileColor =  "#d99e6a";
const darkRevealedTileColor =  "#915b2c";
let flagImage;
let bombImage;
// TODO: Dynamic font-based number printing

// Game state
// TODO: Allow diffrent amounts of mines in the future
const amountMines = 8; 
const tiles = [];
let isMinesLoaded = false;

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); // used for drawing on the board

    loadImages();
    initMap();

    draw();
    document.addEventListener("click", analyzeClick);
    document.addEventListener("contextmenu", analyzeClick);
}

function loadImages(){
    flagImage = new Image();
    flagImage.src = "./flag.png";

    bombImage = new Image();
    bombImage.src = "./bomb.png";
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
        this.revealedColor = color === lightTileColor ? lightRevealedTileColor : darkRevealedTileColor
    }

    getColor() {
        return this.isRevealed ? this.revealedColor : this.color;
    }
}

function initMap(){
    // Init tiles & assign colors
    // TODO: Mines logic
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
    return;
    isMinesLoaded = true;
    let counter = 0;

    while (couner < amountMines) {
        let randRow = Math.floor(Math.random() * rowCount);
        let randCol = Math.floor(Math.random() * columnCount);

        // Always skip chosen tile
        if (randRow === safeRow && randCol === safeCol){
            continue;
        }

        if (!tiles[randRow][randCol].isMine) {
            tiles[randRow][randCol].isMine = true;
            counter++;
        }

        // When counter is full, check there are at least 4 safe tiles; Regenerate if not
    }
}

function draw(){
    for (let r = 0; r < rowCount; r++){
        for (let c = 0; c < columnCount; c++){
            const tile = tiles[r][c];
            context.fillStyle = tile.getColor();
            context.fillRect(tile.x, tile.y, tile.size, tile.size);

            // Draw the flag if needed
            if (tile.isFlagged){
                context.drawImage(flagImage, tile.x, tile.y)
            }

            // If reveled, either print a number or the mine
            if (tile.isRevealed && tile.isMine){
                context.drawImage(bombImage, tile.x, tile.y);
            } else if (tile.isRevealed && !tile.isMine){
                // TODO: Print the number of adjacent mines
            }
        }
    }
}

function analyzeClick(event){
    event.preventDefault();

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
        console.log("Trying to reveal: " + row + col)
        reveal(row, col);
    }

    // Draw new map
    draw();
}

// TODO: Meaningful JSDoc
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
    console.log("Mines: " + total);
    return total;
}

// TODO: JSDoc explaining that this function also returns the amount of revealed tiles
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
                    console.log("Revealing: " + newR + " " + newC);
                    // reveal only if not revealed before to avoid infinite loop
                    if (!tiles[newR][newC].isRevealed){
                        total += reveal(newR, newC);
                    }
                } catch {
                    // Expected EAFP out of bounds 
                }
            }
        }
    }
    console.log(total);
    return total;
}
