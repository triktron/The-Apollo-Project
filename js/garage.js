const gl = document.querySelector("#main").getContext("2d");

function resize() {
  var width = window.innerWidth;
  var height = window.innerHeight;
  if (gl.canvas.width != width ||
      gl.canvas.height != height) {
     gl.canvas.width = width;
     gl.canvas.height = height;
     resetLib();
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

function render() {
  gl.clearRect(0, 0, gl.canvas.width, gl.canvas.height);

  gl.beginPath();
  gl.rect(0, 0, gl.canvas.width / 4, gl.canvas.height);
  gl.fillStyle = "#4286f4";
  gl.fill();

  gl.fillStyle = "back";
  for (var o of objects) {
    gl.beginPath();

    switch (parts[o.id].type) {
      case "thruster-right":
        gl.moveTo(o.x, o.y);
        gl.lineTo(o.x, o.y + o.h);
        gl.lineTo(o.x + o.w, o.y + o.h/2)
        gl.lineTo(o.x, o.y);
        break;
      case "thruster-left":
        gl.moveTo(o.x + o.w, o.y);
        gl.lineTo(o.x + o.w, o.y + o.h);
        gl.lineTo(o.x, o.y + o.h/2)
        gl.lineTo(o.x + o.w, o.y);
        break;
      case "thruster-up":
        gl.moveTo(o.x + o.w/2, o.y);
        gl.lineTo(o.x + o.w, o.y + o.h);
        gl.lineTo(o.x, o.y + o.h)
        gl.lineTo(o.x + o.w/2, o.y);
        break;
      case "thruster-down":
        gl.moveTo(o.x, o.y);
        gl.lineTo(o.x + o.w, o.y);
        gl.lineTo(o.x + o.w/2, o.y + o.h)
        gl.lineTo(o.x, o.y);
        break;
      default:
        gl.rect(o.x,o.y,o.w,o.h);
    }

    gl.stroke();
    for (s of o.linked) {
        gl.beginPath();
        // gl.arc(s.x + s.connect.x,s.y + s.connect.y,10,0,2*Math.PI);
        gl.moveTo(o.x + o.w/2,o.y + o.h/2);
        gl.lineTo(s.x + s.w/2,s.y + s.h/2);
        gl.stroke();
    }
  }


  // for (var p in parts) {
  //   gl.beginPath();
  //   gl.fillStyle = "back";
  //   gl.rect(gl.canvas.width / 12 * (p % 2 + 1) - parts[p].w / 2,40 * (p - p % 2 + 1) ,parts[p].w,parts[p].h);
  //   gl.stroke();
  // }
}

function resetLib() {
  var b = gl.canvas.width / 4;

  var i = objects.length
  while (i--) {
    if (objects[i].x < b) {
        objects.splice(i, 1);
    }
  }


  var packer = new GrowingPacker();

  for (var p of parts) {p.w += 10;p.h += 10;}
  packer.fit(parts, b);
  var e = (b - findmax(parts)) / 2 + 5;
  for (var p of parts) {
    p.w -= 10;p.h -= 10;
    if (p.fit) objects.push(new Part({x: p.fit.x + e,y: p.fit.y + 5,w:p.w,h:p.h, id:p.id}))
  }

  needToRender = true;
}

function findmax(array) {
  var max = 0,
      a = array.length,
      counter

  for (counter=0;counter<a;counter++)
  {
      if (array[counter].fit) if (array[counter].fit.x + array[counter].w > max)
      {
          max = array[counter].fit.x + array[counter].w
      }
  }
  return max
}

function getObjects() {
  var obj = [];
  var b = gl.canvas.width / 4;

  for (var p of objects) if (p.x > b) obj.push(p);

  return obj;
}

function getShipString() {
  var ps = getObjects();
  if (ps.length == 0) return "";

  var offsetX = Infinity, offsetY = Infinity;
  for (p of ps) {
    if (p.x < offsetX) offsetX = p.x;
    if (p.y < offsetY) offsetY = p.y;
  }

  var str = []
  for (p of ps) {
    str.push(p.id + "~" + (p.x - offsetX) + "," + (p.y - offsetY))
  }

  return lzw_encode(str.join("|"));
}

function loadShip(str) {
  var b = gl.canvas.width / 4;

  var i = objects.length
  while (i--) {
    if (objects[i].x > b) {
        objects.splice(i, 1);
    }
  }

  str = lzw_decode(str).split("|");

  for (p of str) {
    var a = p.split("~");
    var id = a[0];
    a = a[1].split(",");
    var x = Number(a[0]), y = Number(a[1]);
    console.log(id,x,y);

    objects.push(new Part({x: x + 150 + b,y: y + 100,w:parts[id].w,h:parts[id].h, id:id}))
    drag.updateSibings();
  }

  needToRender = true;
}

function lzw_encode(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i=1; i<data.length; i++) {
        currChar=data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase=currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i=0; i<out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
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

function main() {
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  checkRender();
  resetLib()
  loadShip("3~80,0|5~105,ĉą2āă1Ă|4~đēĕĒėą1ĈĊ,23ąĕ9ă3Ģ|ĝ4ĦĊĩĈ7Ĭ5|ď411Ġ|Āĵķ52Ć~36ķ6ľĴĶČĽĿ5ŇńĮ4ŁĠ0ľĕ42ķĢľĝ37ķ277Į50ŝşĹā3,469Ŀħũ7ŬĤŨłŬćĒŨ4Ű|0~4Ź,564Ŀ497ƀƅŭƆƈŬ9ĈċġąƎ19ƐĨ6Ė,ħą7~22ĦĨ8ŀŸ3ŬƣŷũƦ|ƎŮ55ƍĈ8ŨƯŬƝ17ųƔŻĞ8ƀū|Ƙ5ƺƱśŗťƎŢǇŠƣǆĠś|ƣǊǏŠƘǎľƝŋŝƬŽſłƃǙſƁƃǖ5Ƈǣ")

}

//"3~80,0|5~105,ĉą2āă1Ă|4~đēĕĒėą0Ĉċ23ĜĈ9ğġ|1ĈĊ,Ġąĕ9ă3ĦĨ4İĊħĈ7ĵ5|Ā359ī41|ďľŀ19ŃŅĿČł"

window.addEventListener('load', main);


class Part {
  constructor(opts) {
    this.x = opts.x;
    this.y = opts.y;
    this.w = opts.w;
    this.h = opts.h;
    this.id = opts.id;
    this.render = opts.render;
    this.linked = [];

    this.points = [
      {x:this.w/2,y:0},
      {x:this.w/2,y:this.h},
      {x:0,y:this.h/2},
      {x:this.w,y:this.h/2}
    ]
  }

  isPointOn(x,y) {
    return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
  }
}

class Dragble {
  constructor(opts) {
    var self = this;
    this.gl = opts.gl;

    this.objects = [];

    this.mouseX = 0;
    this.mouseY = 0;

    this.gl.canvas.addEventListener('mousedown', e => self.handleMouseDown(e))
    this.gl.canvas.addEventListener('mousemove', e => self.handleMouseMove(e))
    this.gl.canvas.addEventListener('mouseup', e => self.handleMouseUp(e))
  }

  setBodies(b) {
    this.objects = b;
    for (var obj of this.objects) {
      obj.isDragging = false;
      obj.offsetX = 0;
      obj.offsetY = 0;
    }
  }

  handleMouseDown(e){
    e.preventDefault()
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;

    for (var obj of this.objects) {
      if (obj.isPointOn(this.mouseX,this.mouseY)) {
        this.startDrag(obj, e.button == 2)
        break;
      }
    }
  }

  startDrag(obj, recursive = false) {
    obj.offsetX=parseInt(this.mouseX - obj.x);
    obj.offsetY=parseInt(this.mouseY - obj.y);
    obj.isDragging=true;

    if (recursive) {
      for (var a of obj.linked) {
        if (!a.isDragging) {
          this.startDrag(a, true);
        }
      }
    }
  }

  handleMouseUp(e){
    e.preventDefault()
    for (var obj of this.objects) obj.isDragging=false;

    resetLib()
  }

  handleMouseMove(e){
    e.preventDefault()
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;

    var check = false;

    for (var obj of this.objects) if (obj.isDragging) {
      obj.x=parseInt(this.mouseX - obj.offsetX);
      obj.y=parseInt(this.mouseY - obj.offsetY);
      check = true;
    }

    var t0 = performance.now();
    if (check)  {
      this.checkSnap();
      this.updateSibings();

      needToRender = true;
    }
    var t1 = performance.now();
    // console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.")
  }

  updateSibings() {
    for (var i of this.objects) i.linked = [];
    for (var i in this.objects) {
      for (var z = Number(i) + 1;z < this.objects.length;z++) {

            for (var a of this.objects[i].points) {
              for (var b of this.objects[z].points) {
                if ( (this.objects[i].x + a.x) == (this.objects[z].x + b.x) && (this.objects[i].y + a.y) == (this.objects[z].y + b.y) ) {
                  this.objects[i].linked.push(this.objects[z]);
                  this.objects[z].linked.push(this.objects[i]);
                }
              }
            }

      }
    }
  }

  checkSnap() {
    var d = 15, x = 0, y = 0;
    var matches = [];
    for (var i in this.objects) {
      for (var z = Number(i) + 1;z < objects.length;z++) {
        for (var pointA of this.objects[i].points) {
          for (var pointB of this.objects[z].points) {
            if (!this.objects[i].isDragging && !this.objects[z].isDragging) continue;

              var a = (this.objects[i].x + pointA.x) - (pointB.x + this.objects[z].x);
              var b = (this.objects[i].y + pointA.y) - (pointB.y + this.objects[z].y);

              var c = Math.sqrt(a * a + b * b);
              if (c < d) {
                var m = this.objects[i].isDragging ? -1 : 1;
                d = c;
                matches.push({x: a * m, y: b * m, obj: this.objects[i]})
              }

          }
        }
      }
    }


    for (var c of matches.reverse()) {
          this.mouseX += c.x;
          this.mouseY += c.y;
          this.moveObjects();
          if (!this.isCollide()) break;
          this.mouseX -= c.x;
          this.mouseY -= c.y;
    }

    this.moveObjects();
  }

  moveObjects() {
    for (var obj of this.objects) if (obj.isDragging) {
      obj.x=parseInt(this.mouseX - obj.offsetX);
      obj.y=parseInt(this.mouseY - obj.offsetY);
    }
  }

  isCollide() {
    for (var i in this.objects) {
      for (var z = Number(i) + 1;z < objects.length;z++) {
        var a = this.objects[i];
        var b = this.objects[z];
        if (!(
            ((a.y + a.h) <= (b.y)) ||
            (a.y >= (b.y + b.h)) ||
            ((a.x + a.w) <= b.x) ||
            (a.x >= (b.x + b.w))
        )) return true;
      }
    }

    return false
  }
}

// objects.push(new Part({x: 50,y: 50,w:100,h:80,id:0}))
// objects.push(new Part({x: 200,y: 50,w:50,h:80,id:1}))
// objects.push(new Part({x: 300,y: 50,w:50,h:50,id:2}))
// objects.push(new Part({x: 350,y: 50,w:50,h:50,id:2}))
// objects.push(new Part({x: 400,y: 50,w:50,h:50,id:2}))
// objects.push(new Part({x: 300,y: 100,w:50,h:50,id:2}))
// objects.push(new Part({x: 350,y: 100,w:50,h:50,id:2}))
// objects.push(new Part({x: 400,y: 100,w:50,h:50,id:2}))

var drag = new Dragble({
  gl:gl
})

drag.setBodies(objects)
