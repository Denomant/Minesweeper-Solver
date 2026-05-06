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
let flagImage;
let bombImage;
// TODO: Dynamic font-based number printing

// Game state
// TODO: Allow diffrent amounts of mines in the future
const amountMines = 8; 
const tiles = new Set();

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); // used for drawing on the board

    loadImages();
    initMap();

    draw();
}

function loadImages(){
    flagImage = new Image();
    flagImage.src = "./flag.png"

    bombImage = new Image();
    bombImage.src = "./bomb.png"
}

class Tile {
    constructor(color, x, y, size) {
        this.color = color;
        this.x = x;
        this.y = y;
        this.size  = size;

        this.isRevealed = false;
        this.isFlagged = false;
        this.isMine = false;
    }
}

function initMap(){
    // Init tiles & assign colors
    // TODO: Mines logic
    for (let r = 0; r < rowCount; r++){
        for (let c = 0; c < columnCount; c++){
            // Where exactly the tile is going to be printed
            const x = c * tileSize;
            const y = r * tileSize;
            const color = (r+c) % 2 === 0 ? lightTileColor : darkTileColor
            
            const tile = new Tile(color, x, y, tileSize);
            tiles.add(tile);
        }
    }
}

function draw(){
    for (let tile of tiles){
        context.fillStyle = tile.color;
        context.fillRect(tile.x, tile.y, tile.size, tile.size);
    }
}