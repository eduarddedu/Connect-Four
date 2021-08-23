var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Color;
(function (Color) {
    Color[Color["RED"] = 0] = "RED";
    Color[Color["YELLOW"] = 1] = "YELLOW";
})(Color || (Color = {}));
var Status;
(function (Status) {
    Status[Status["RED_MOVES"] = 0] = "RED_MOVES";
    Status[Status["YELLOW_MOVES"] = 1] = "YELLOW_MOVES";
    Status[Status["RED_WINS"] = 2] = "RED_WINS";
    Status[Status["YELLOW_WINS"] = 3] = "YELLOW_WINS";
    Status[Status["DRAW"] = 4] = "DRAW";
})(Status || (Status = {}));
var Vector;
(function (Vector) {
    Vector[Vector["NE"] = 0] = "NE";
    Vector[Vector["E"] = 1] = "E";
    Vector[Vector["SE"] = 2] = "SE";
    Vector[Vector["S"] = 3] = "S";
    Vector[Vector["SW"] = 4] = "SW";
    Vector[Vector["W"] = 5] = "W";
    Vector[Vector["NW"] = 6] = "NW";
})(Vector || (Vector = {}));
var Move = /** @class */ (function () {
    function Move(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }
    return Move;
}());
var Board = /** @class */ (function () {
    function Board(moves) {
        this.movesCount = 0;
        this.grid = new Array(7);
        for (var i = 0; i < 7; i++) {
            this.grid[i] = new Array(6);
        }
        if (moves) {
            for (var x = 0; x < 7; x++) {
                for (var y = 0; y < 6; y++) {
                    if (moves[x][y] !== undefined) {
                        this.grid[x][y] = moves[x][y];
                        this.movesCount++;
                    }
                }
            }
            this.status = this.movesCount % 2 === 0 ? Status.RED_MOVES : Status.YELLOW_MOVES;
        }
        else {
            this.movesCount = 0;
            this.status = Status.RED_MOVES;
        }
    }
    /**
    * @param board the board in a given state
    * @returns an array of all legal moves for the current turn
    */
    Board.nextLegalMoves = function (board) {
        if (board.status === Status.DRAW || board.status === Status.RED_WINS || board.status === Status.YELLOW_WINS) {
            return [];
        }
        else {
            var color = board.status === Status.RED_MOVES ? Color.RED : Color.YELLOW;
            var result = [];
            for (var x = 0; x < 7; x++) {
                for (var y = 0; y < 6; y++) {
                    if (board.grid[x][y] === undefined && (y === 0 || board.grid[x][y - 1] !== undefined)) {
                        result.push(new Move(x, y, color));
                    }
                }
            }
            return result;
        }
    };
    Board.prototype.takeMove = function (move) {
        this.grid[move.x][move.y] = move.color;
        this.lastMove = move;
        this.movesCount++;
        this.updateStatus();
    };
    Board.prototype.updateStatus = function () {
        this.checkVectors();
    };
    Board.prototype.checkVectors = function () {
        var kinds = Object.keys(Vector).map(function (key) { return Vector[key]; });
        for (var _i = 0, kinds_1 = kinds; _i < kinds_1.length; _i++) {
            var v = kinds_1[_i];
            if (this.checkVector(v)) {
                this.status = this.lastMove.color === Color.RED ? Status.RED_WINS : Status.YELLOW_WINS;
                return;
            }
        }
        if (this.movesCount === 42) {
            this.status = Status.DRAW;
        }
        else {
            this.status = this.lastMove.color === Color.RED ? Status.YELLOW_MOVES : Status.RED_MOVES;
        }
    };
    Board.prototype.isSameColor = function (color) {
        return color === this.lastMove.color;
    };
    /**
     * @param vector a check vector, where the initial point is given by the (x, y) of the last move
     * @returns true if there are four connected cells along the check direction and false otherwise
     */
    Board.prototype.checkVector = function (v) {
        var x = this.lastMove.x;
        var y = this.lastMove.y;
        switch (v) {
            case Vector.S:
                if (y >= 3) {
                    for (var i = y - 1; i >= y - 3; i--) {
                        var color = this.grid[x][i];
                        if (!this.isSameColor(color)) {
                            return false;
                        }
                    }
                    return true;
                }
                else {
                    return false;
                }
            case Vector.SE:
                if (x <= 3 && y >= 3) {
                    for (var k = x + 1, i = y - 1; k <= x + 3; k++, i--) {
                        var color = this.grid[k][i];
                        if (!this.isSameColor(color)) {
                            return false;
                        }
                    }
                    return true;
                }
                else {
                    return false;
                }
            case Vector.SW:
                if (x >= 3 && y >= 3) {
                    for (var k = x - 1, i = y - 1; k >= 0; k--, i--) {
                        var color = this.grid[k][i];
                        if (!this.isSameColor(color)) {
                            return false;
                        }
                    }
                    return true;
                }
                else {
                    return false;
                }
            case Vector.W:
                if (x >= 3) {
                    for (var k = x - 1; k >= x - 3; k--) {
                        var color = this.grid[k][y];
                        if (!this.isSameColor(color)) {
                            return false;
                        }
                    }
                    return true;
                }
                else {
                    return false;
                }
            case Vector.NW:
                if (x >= 3 && y <= 2) {
                    for (var k = x - 1, i = y + 1; k >= x - 3; k--, i++) {
                        var color = this.grid[k][i];
                        if (!this.isSameColor(color)) {
                            return false;
                        }
                    }
                    return true;
                }
                else {
                    return false;
                }
            case Vector.NE:
                if (x <= 3 && y <= 2) {
                    for (var k = x + 1, i = y + 1; k <= x + 3; k++, i++) {
                        var color = this.grid[k][i];
                        if (!this.isSameColor(color)) {
                            return false;
                        }
                    }
                    return true;
                }
                else {
                    return false;
                }
            case Vector.E:
                if (x <= 3) {
                    for (var k = x + 1; k <= x + 3; k++) {
                        var color = this.grid[k][y];
                        if (!this.isSameColor(color)) {
                            return false;
                        }
                    }
                    return true;
                }
                else {
                    return false;
                }
        }
    };
    return Board;
}());
var GameNode = /** @class */ (function (_super) {
    __extends(GameNode, _super);
    function GameNode(parent) {
        var _this = _super.call(this, parent ? parent.grid : null) || this;
        _this.children = [];
        _this.parent = parent;
        if (parent) {
            parent.children.push(_this);
        }
        return _this;
    }
    return GameNode;
}(Board));
var Ply = /** @class */ (function (_super) {
    __extends(Ply, _super);
    function Ply() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Ply;
}(Array));
var GameTree = /** @class */ (function () {
    function GameTree() {
        this.plyCount = 0; // TODO delete
        this.root = new GameNode(null);
        var ply = new Ply();
        ply.push(this.root);
        this.makeChildren(ply);
    }
    GameTree.prototype.makeChildren = function (ply) {
        if (++this.plyCount === 8) {
            console.log('EXIT -> plyCount = ', this.plyCount);
            return;
        }
        if (ply.length === 0) {
            console.log('EXIT -> no more children');
            return;
        }
        var children = new Ply();
        for (var _i = 0, ply_1 = ply; _i < ply_1.length; _i++) {
            var parent_1 = ply_1[_i];
            for (var _a = 0, _b = Board.nextLegalMoves(parent_1); _a < _b.length; _a++) {
                var move = _b[_a];
                var child = new GameNode(parent_1);
                child.takeMove(move);
                children.push(child);
            }
        }
        this.makeChildren(children);
    };
    return GameTree;
}());
var Database = /** @class */ (function () {
    function Database() {
        this.tree = new GameTree();
    }
    /**
     *
     * @param node  any node in the game graph with the condition that RED moves next
     * @returns an array containing the next best moves for RED
     */
    Database.prototype.maximinRoot = function (node) {
        if (node.status !== Status.RED_MOVES) {
            throw new Error('Maximin error: game status must be RED_MOVES');
        }
        var result = [];
        var minimum = -Infinity;
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
            var value = Math.max(minimum, this.maximin(child, -1));
            if (minimum <= value) {
                minimum = value;
                result.push(child.lastMove);
            }
        }
        return result;
    };
    /**
     *
     * @param node the game in a given state
     * @param i index of the player of interest
     * @returns maximin value
     */
    Database.prototype.maximin = function (node, i) {
        if (node.children.length === 0) {
            return this.evaluateNode(node);
        }
        if (i === 1) {
            var minimum = -Infinity;
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var child = _a[_i];
                minimum = Math.max(minimum, this.maximin(child, i * -1));
            }
            return minimum;
        }
        else {
            var maximum = Infinity;
            for (var _b = 0, _c = node.children; _b < _c.length; _b++) {
                var child = _c[_b];
                maximum = Math.min(maximum, this.maximin(child, i * -1));
            }
            return maximum;
        }
    };
    Database.prototype.evaluateNode = function (b) {
        switch (b.status) {
            case Status.RED_WINS:
                return 1;
            case Status.YELLOW_WINS:
                return -1;
            case Status.DRAW:
                return 0;
        }
    };
    return Database;
}());
function printNode(node) {
    console.log('NODE');
    console.log(node);
}
function printTerminalNodes(node) {
    if (node.status === Status.DRAW || node.status === Status.RED_WINS || node.status === Status.YELLOW_WINS) {
        printNode(node);
    }
    else {
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
            printTerminalNodes(child);
        }
    }
}
var countRedWins = 0;
var countYellowWins = 0;
var countDraw = 0;
function countTerminalNodes(node) {
    if (node.status === Status.RED_WINS) {
        countRedWins++;
    }
    else if (node.status === Status.YELLOW_WINS) {
        countYellowWins++;
    }
    else if (node.status === Status.DRAW) {
        countDraw++;
    }
    else {
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
            countTerminalNodes(child);
        }
    }
}
var db = new Database();
// printTerminalNodes(db.tree.root);
// testVectorWest();
countTerminalNodes(db.tree.root);
console.log('Terminal nodes count: ');
console.log('RED_WINS: ', countRedWins);
console.log('YELLOW_WINS: ', countYellowWins);
console.log('DRAW: ', countDraw);
function testVectorWest() {
    var root = new GameNode(null);
    var moves = [
        new Move(1, 0, Color.RED),
        new Move(0, 0, Color.YELLOW),
        new Move(2, 0, Color.RED),
        new Move(0, 1, Color.YELLOW),
        new Move(3, 0, Color.RED),
        new Move(0, 2, Color.YELLOW),
        new Move(4, 0, Color.RED)
    ];
    for (var _i = 0, moves_1 = moves; _i < moves_1.length; _i++) {
        var move = moves_1[_i];
        root.takeMove(move);
    }
}
