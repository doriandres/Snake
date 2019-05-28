function random(max) {
    return Math.floor(Math.random() * max)
}

function getRandDirection(notIn = []) {    
    var direction = "";
    do {
        switch (random(4)) {
            case (0):
                direction = "top";
                break;
            case (1):
                direction = "bottom";
                break;
            case (2):
                direction = "left";
                break;
            case (3):
                direction = "right";
                break;
        }
    } while (notIn.includes(direction))
    return direction;
}

function getOpositeDirection(direction) {
    if (direction === "top") {
        return "bottom";
    }
    if (direction === "bottom") {
        return "top";
    }
    if (direction === "left") {
        return "right";
    }
    if (direction === "right") {
        return "left";
    }
}

function getEdges(space, field) {
    var edges = [];
    if (space.y === 0) {
        edges.push("top");
    }
    if (space.x === 0) {
        edges.push("left");
    }
    if (space.y === field.height - 1) {
        edges.push("bottom");
    }
    if (space.x === field.width - 1) {
        edges.push("right");
    }
    return edges;
}

class Space {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.spaceElement = document.createElement("td");
        this._object = null;
    }

    set object(value) {
        this._object = value;
        if (this._object !== null) {
            this.spaceElement.className = this._object.name;
        } else {
            this.spaceElement.removeAttribute("class");
        }
    }

    get object() {
        return this._object;
    }
}

class Field {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.fieldElement = document.createElement("table");
        this.fieldSpaces = [];
        this.apples = [];
        this._buildField(width, height);
        document.getElementById("game").appendChild(this.fieldElement);
    }
    _buildField(width, height) {
        this.fieldElement.innerHTML = "";
        for (let h = 0; h < height; h++) {
            let tr = document.createElement("tr");
            let row = [];
            for (let w = 0; w < width; w++) {
                let space = new Space(w, h);
                tr.appendChild(space.spaceElement);
                row.push(space);
            }
            this.fieldSpaces.push(row);
            this.fieldElement.appendChild(tr);
        }
    }

    getRelativePosition(referenceSpace, space){
        if(space.y < referenceSpace.y){
            return "top";
        }
        if(space.y > referenceSpace.y){
            return "bottom";
        }
        if(space.x < referenceSpace.x){
            return "left";
        }
        if(space.x > referenceSpace.x){
            return "right";
        }
        return null;
    }

    getRelativeSpace(space, direction){
        var x = space.x;
        var y = space.y;

        if(direction === "top"){
            y-=1;
        }else
        if(direction === "bottom"){
            y+=1;
        }
        else
        if(direction === "left"){
            x-=1;
        }
        else
        if(direction === "right"){
            x+=1;
        }

        return this.fieldSpaces[y] ? this.fieldSpaces[y][x] || null : null;
    }

    getRandomRelativeSpace(space) {
        var top = this.fieldSpaces[space.y - 1] ? this.fieldSpaces[space.y - 1][space.x] || null : null;
        var bottom = this.fieldSpaces[space.y + 1] ? this.fieldSpaces[space.y + 1][space.x] || null : null;
        var left = this.fieldSpaces[space.y][space.x - 1] || null;
        var right = this.fieldSpaces[space.y][space.x + 1] || null;
        var relativeSpaces = [];

        if(top !== null && top.object === null){
            relativeSpaces.push(top);
        }

        if(bottom !== null && bottom.object === null){
            relativeSpaces.push(bottom);
        }

        if(left !== null && left.object === null){
            relativeSpaces.push(left);
        }

        if(right !== null && right.object === null){
            relativeSpaces.push(right);
        }

        return !relativeSpaces.length ? null : relativeSpaces[random(relativeSpaces.length)];
    }
}

class SnakeChunk {
    constructor(space) {
        this._space = space;
        this.name = "snake-chunk";
        this.next = null;
        space.object = this;
    }

    set space(value) {
        var lastSpace = this._space;

        this._space = value;
        this._space.object = this;

        if(this.next){
            this.next.space = lastSpace;
        }
        lastSpace.object = this.next;        
    }

    get space() {
        return this._space;
    }
}

class Snake {
    constructor(field, length) {
        this.field = field;
        this.dead = false;
        this.length = isNaN(length) ? 5 : length > 1 ? length : 5;  
        this.chunks = [];              
        this._buildSnake();
        this.head = this.chunks[0];
        this.last = this.chunks[this.length-1];    
        this.direction = getRandDirection([...getEdges(this.head, this.field), this.field.getRelativePosition(this.head.space, this.head.next.space)]);
    }
    _buildSnake() {        
        do{            
            this.chunks = [];
            let prev = new SnakeChunk(this.field.fieldSpaces[random(this.field.height)][random(this.field.width)]);
            this.chunks.push(prev);            
            for(let i = 1; i < this.length; i++){
                let space  = this.field.getRandomRelativeSpace(prev.space);
                if(space === null){
                    break;
                }
                var chunk = new SnakeChunk(space);
                this.chunks.push(chunk);           
                prev.next = chunk;
                prev = chunk;
            }    
        }while(this.chunks.length !== this.length);        
    }
    walk(){
        let space  = this.field.getRelativeSpace(this.head.space, this.direction);
        if(space === null || space.object instanceof SnakeChunk){
            this.dead = true;
            return;
        }
        let lastSpace = this.last.space;
        let grow = space.object instanceof Apple;
        let apple = grow ? space.object : null;
        if(apple){
            apple.disappear();
        }
        
        this.head.space = space;
        if(grow){
            this.grow(lastSpace);
        }else{
            lastSpace.object = null;
        }
        return grow;     
    }
    grow(lastSpace){
        var chunk =  new SnakeChunk(lastSpace);
        this.chunks.push(chunk);
        this.last.next = chunk;
        this.last = chunk;
        this.length++;
    }
}

class Apple{
    constructor(field){
        this.field = field;
        this.space;
        this.name = "apple"; 
        this._place();       
    }

    _place(){
        let space;
        do{
            space  =  this.field.fieldSpaces[random(this.field.height)][random(this.field.width)]
        }while(space.object !== null);
        this.space = space;
        space.object = this;
    }

    disappear(){
        if(this.space){
            this.space.object = null;
            this.space = null;        
        }        
    }
}

class SnakeGame{
    constructor(field, snake, scoreElement, highestScoreElement){
        this.scoreElement = scoreElement;
        this.highestScoreElement = highestScoreElement;
        this._score = 0;
        this.field = field;
        this.snake =  snake;
        this.apples = [];
        this._moveSpeed = 200;
        this.setUpMovement();
        this.appleGenerationsInterval = setInterval(this.appleGenerationsLoop.bind(this),5000);
        this._controlHandler = this.controlHandler.bind(this);
        window.addEventListener("keydown", this._controlHandler);

        if(highestScoreElement && highestScoreElement.textContent){
            highestScoreElement.textContent = localStorage.getItem("highest") || 0;            
        }
        for(let i = 0; i < 5; i++){
            this.apples.push(new Apple(this.field));
        }
    }
    get score(){
        return this._score;
    }
    set score(value){
        this._score = value;
        if(this.scoreElement && this.scoreElement.textContent){
            this.scoreElement.textContent = this._score;
        }
        
    }

    setUpMovement(increaseSpeed){
        if(!isNaN(this.moveInterval)){
            clearInterval(this.moveInterval);
        }        
        if(increaseSpeed && this._moveSpeed > 50){
            this._moveSpeed -= 0.5;
        }
        this.moveInterval = setInterval(this.movementLoop.bind(this), this._moveSpeed);
    }

    appleGenerationsLoop(){
        this.apples.forEach(a => a.disappear());
        this.apples = [];
        for(let i = 0; i < 5; i++){
            this.apples.push(new Apple(this.field));
        }
    }

    controlHandler(event){
        var key  = event.key.toLowerCase();
        var newDirection;
        if(key.includes("up") || key === "w"){
            newDirection = "top";
        }else
        if(key.includes("down") || key === "s"){
            newDirection = "bottom";
        }
        else
        if(key.includes("left") || key === "a"){
            newDirection = "left";
        }
        else
        if(key.includes("right") || key === "d"){
            newDirection = "right";
        }
        if(newDirection !== getOpositeDirection(this.snake.direction) && newDirection !== this.snake.direction){
            this.snake.direction = newDirection;
            if(this.snake.walk()){
                this.score++;
                setUpMovement(true);
            }else{
                setUpMovement();
            }            
        }
    }
    movementLoop(){
        requestAnimationFrame(()=>{
            if(!this.snake.dead){
                if(this.snake.walk()){
                    this.score++;
                    setUpMovement(true);
                }
            }else{
                clearInterval(this.moveInterval);
                clearInterval(this.appleGenerationsInterval);
                window.removeEventListener("keydown", this._controlHandler);
                let highest = localStorage.getItem("highest");
                if(highest === null || highest && !isNaN(highest) && this.score > parseInt(highest)){
                    localStorage.setItem("highest", this.score);
                }                
                alert("Game Over");
                window.location = window.location;
            }
        })        
    }
}


(() => {    
    var field  = new Field(20, 20);
    var snake = new Snake(field, 5);
    new SnakeGame(field, snake, document.getElementById("score"), document.getElementById("highest"));
})();