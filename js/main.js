// var world = new p2.World({
//     gravity : [0,0]
// });

var world;

function loadShip(str) {
  str = lzw_decode(str).split("|");
  ship.parts = []
  ship.bodies = []

  for (p in str) {
    var a = str[p].split("~");
    var id = a[0];
    a = a[1].split(",");
    var x = Number(a[0]), y = Number(a[1]);

    ship.parts[p] = new Part({x: x,y: y,w:parts[id].w,h:parts[id].h, id:id})
  }


  ship.updateChunks();

  needToRender = true;
}

function lzw_decode(s) {
    var dict = {};
    var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i=1; i<data.length; i++) {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        }
        else {
           phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
}

// const gl = document.querySelector("#main").getContext("2d");

function resize() {
  var width = window.innerWidth;
  var height = window.innerHeight;
  if (gl.canvas.width != width ||
      gl.canvas.height != height) {
     gl.canvas.width = width;
     gl.canvas.height = height;
     needToRender = true;
  }
}

var objects = [];
var parts = [
  {w:50,h:50,id:0},
  {w:50,h:100,id:1},
  {w:100,h:50,id:2},
  {w:100,h:100,id:3},
  {w:80,h:50,id:4},
  {w:50,h:80,id:5},
  {w:40,h:50,id:6,type:"thruster-left"},
  {w:40,h:50,id:7,type:"thruster-right"},
  {w:50,h:40,id:8,type:"thruster-up"},
  {w:50,h:40,id:9,type:"thruster-down"}
]
var needToRender = true;
function checkRender() {
  if (resize() || needToRender) {
     needToRender = false;
     render();
   }
   requestAnimationFrame(checkRender);
}

var colors = [ "#FFF7A5", "#FFA5E0", "#A5B3FF", "#BFFFA5", "#FFCBA5" ];
function render() {
  gl.clearRect(0, 0, gl.canvas.width, gl.canvas.height);

  for (var c in ship.chunks) {
    gl.fillStyle = colors[c];
  for (var o of ship.chunks[c]) {}
  }
}

function main() {
  // if (!gl) {
  //   alert("Unable to initialize WebGL. Your browser or machine may not support it.");
  //   return;
  // }

  // checkRender();
  var app = new p2.WebGLRenderer(function(){
      world = new p2.World({
          gravity : [0,0]
      });

      this.setWorld(world);

      loadShip2();
      // loadShip("1~0,0|ĀĂ10Ą7~5Ă25|ċč,1ď");


      // Key controls
      var keys = {
          '37': 0, // left
          '39': 0, // right
          '38': 0, // up
          '40': 0 // down
      };
      this.on("keydown",function (evt){
          keys[evt.keyCode] = 1;
          onInputChange();
      });
      this.on("keyup",function (evt){
          keys[evt.keyCode] = 0;
          onInputChange();
      });
      function onInputChange(){
        for (var s of ship.bodies[0].shapes) {
          var t = 3, p = [s.position[0] - ship.bodies[0].w / 2, s.position[1] + ship.bodies[0].h / 2];
          if (keys[37] || keys[38] || keys[39] || keys[40]) ship.bodies[0].wakeUp();
          if (keys[38] && s.partType == "thruster-down")  ship.bodies[0].applyForceLocal(p2.vec2.fromValues(0,t) , p);
          if (keys[40] && s.partType == "thruster-up")    ship.bodies[0].applyForceLocal(p2.vec2.fromValues(0,-t), p);
          if (keys[37] && s.partType == "thruster-right") ship.bodies[0].applyForceLocal(p2.vec2.fromValues(-t,0), p);
          if (keys[39] && s.partType == "thruster-left")  ship.bodies[0].applyForceLocal(p2.vec2.fromValues(t,0) , p);
        }
      }

      this.frame(0, 0, 6, 6);
  });
}
window.addEventListener('load', main);

class Part {
  constructor(opts) {
    this.x = opts.x;
    this.y = opts.y;
    this.w = opts.w;
    this.h = opts.h;
    this.id = opts.id;
    this.render = opts.render;
  }

  isPointOn(x,y) {
    return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
  }
}

class Ship {
  constructor(opts) {
    this.parts = [];
    this.chunks = [];

    this.bodies = [];
  }

  updateChunks(list, part, id = 0, first = true) {
    var list = list || this.parts;
    if (first) this.chunks[id] = [];
    if (!part) {
      part = list.splice(0,1)[0];
      this.chunks[id].push(part);
    }

    var i = list.length
    while (i--) {
      if (this.isCollide(part,list[i])) {
        if (!this.chunks[id]) this.chunks[id] = [];
        this.chunks[id].push(list[i]);
        this.updateChunks(list, list.splice(i,1)[0], id, false);
      }
    }

    if (first) {
      if (list.length != 0) {
        id++;
        this.updateChunks(list, null, id);
      } else {
        var i = 0;
        for (var c in this.chunks) {

        this.updateBody(c);
        for (var o of this.chunks[c]) {
          this.parts[i++] = o;
        }
        }
      }
    }
  }

  updateBody(id) {
    this.bodies[id] = new p2.Body({
        position:[0,0],
        mass : 1,
        angularVelocity : 0,
        damping: 0.3
    })

    this.bodies[id].w = 0;
    this.bodies[id].h = 0;

    for (var o of this.chunks[id]) {
      var shape;
      switch (parts[o.id].type) {
        case "thruster-right":
          shape = new p2.Convex({ vertices: [[-o.w/200, o.h/200], [-o.w/200, -o.h/200], [o.w/200, 0]] });
          break;
        case "thruster-left":
          shape = new p2.Convex({ vertices: [[o.w/200, -o.h/200], [o.w/200, o.h/200], [-o.w/200, 0]] });
          break;
        case "thruster-up":
        shape = new p2.Convex({ vertices: [[-o.w/200, -o.h/200], [o.w/200, -o.h/200], [0, o.h/200]] });
          break;
        case "thruster-down":
        shape = new p2.Convex({ vertices: [[0, -o.h/200], [o.w/200, o.h/200], [-o.w/200, o.h/200]] });
          break;
        default:
          shape = new p2.Box({ width: o.w/100, height: o.h/100 });
      }

      shape.partType = parts[o.id].type;
      this.bodies[id].addShape(shape, [o.x/100 + o.w/200,-(o.y/100 + o.h/200)]);
      var aabb = this.bodies[id].getAABB();
      this.bodies[id].w = Math.max(this.bodies[id].w, Math.abs(aabb.lowerBound[0]), Math.abs(aabb.upperBound[0]))
      this.bodies[id].h = Math.max(this.bodies[id].h, Math.abs(aabb.lowerBound[1]), Math.abs(aabb.upperBound[1]))
    }

    world.addBody(this.bodies[id]);
  }

  isCollide(a, b) {
    if (!a || !b) return false;
        return !(
            ((a.y + a.h) < (b.y)) ||
            (a.y > (b.y + b.h)) ||
            ((a.x + a.w) < b.x) ||
            (a.x > (b.x + b.w))
        )
  }
}

var ship = new Ship();

function loadShip1() {
  loadShip("3~80,0|5~105,ĉą2āă1Ă|4~đēĕĒėą1ĈĊ,23ąĕ9ă3Ģ|ĝ4ĦĊĩĈ7Ĭ5|9ĈċġąĴ19ĶĨ6Ė,ħą7~22ĦĢ");
}
function loadShip2() {
  loadShip("2~50,0|3āăĂ|5~1Ă,6ąĀďĎąČăđ|1~75,20ą4~đ,3ġĚčă2ĝĩ14īĭ9ĪĦĲčİĵ5|8Ĵ23ĺļįīĿ|6Ĵą7čď0");
}
function loadShip3() {
  loadShip("3~50,30|5~ă4Ć4~6ă18ĆĈ1Ă,ċ|8ĉ,ĆĚĕăĆ9ě12ġ~ğ,ĤĆ7ħċĩĒ|0~75ĩą|6~ĥį0");
}
function loadShip4() {
  loadShip("0~89,15|5~13ă0ć~40,č9āă6Ć7ĉĂĄĆ6~đą");
}
