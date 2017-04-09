(function(){
  function deg2rad(d){
    return (2 * Math.PI * d) / 360;
  }

  function rad2deg(r){
    return (360 * r) / (2 * Math.PI);
  }

  function distance(x1, y1, x2, y2){
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }

  var Gear = function(x, y, connectionRadius, teeth, fillStyle, strokeStyle){
    this.x = x;
    this.y = y;
    this.connectionRadius = connectionRadius;
    this.teeth = teeth;

    this.fillStyle = fillStyle;
    this.strokeStyle = strokeStyle;

    this.diameter = teeth * 4 * connectionRadius;
    this.radius = this.diameter / ( 2 * Math.PI );
    this.phi0 = 0;
    this.angularSpeed = 0;
    this.createdAt = new Date();
  }

  Gear.prototype.render = function(context){
    var ellapsed = new Date() - this.createdAt;
    var phiDegrees = this.angularSpeed * ( ellapsed / 1000);
    var phi = this.phi0 + deg2rad(phiDegrees);

    context.fillStyle = this.fillStyle;
    context.strokeStyle = this.strokeStyle;
    context.lineCap = 'round';
    context.lineWidth = 1;

    context.beginPath();

    for(var i = 0; i < this.teeth * 2; i++){
      var alpha = 2 * Math.PI * (i / ( this.teeth * 2 )) + phi;
      var x = this.x + Math.cos(alpha) * this.radius;
      var y = this.y + Math.sin(alpha) * this.radius;
      context.arc(x, y, this.connectionRadius, -Math.PI / 2 + alpha, Math.PI / 2 + alpha, i % 2 == 0);
      context.fill();
      context.stroke();

    }
    context.beginPath();
    context.arc(this.x, this.y, this.connectionRadius, 0, 2 * Math.PI, true);
    context.fill();
    context.stroke();
  }

  Gear.prototype.connect = function(x, y){
    var r = this.radius;
    var dist = distance(x, y, this.x, this.y);
    var newRadius = Math.max(dist - r, 10);
    var newDiam = newRadius * 2 * Math.PI;
    var newTeeth = Math.round(newDiam / (4 * this.connectionRadius));
    console.log(newRadius);
    var actualDiameter = newTeeth * 4 * this.connectionRadius;
    var actualRadius = actualDiameter / (2 * Math.PI);
    var actualDist = r + actualRadius;
    var alpha = Math.atan2(y - this.y, x - this.x);
    var actualX = this.x + Math.cos(alpha) * actualDist;
    var actualY = this.y + Math.sin(alpha) * actualDist;

    var newGear = new Gear(actualX, actualY, this.connectionRadius, newTeeth, this.fillStyle, this.strokeStyle);
    var gearRatio = this.teeth / newTeeth; 
    newGear.angularSpeed = -this.angularSpeed * gearRatio;

    this.phi0 = alpha + (this.phi0 - alpha); 
    newGear.phi0 = alpha + Math.PI + (Math.PI / newTeeth) + (this.phi0 - alpha) * (newGear.angularSpeed / this.angularSpeed);
    newGear.createdAt = this.createdAt;

    return newGear;
  }



  var canvas = document.getElementById('myCanvas');
  var context = canvas.getContext('2d');
  var W = canvas.width;
  var H = canvas.height;
  var gear = new Gear(W / 2, H / 2, 5, 12, "white", "rgba(61, 142, 198, 1)")
  gear.angularSpeed = 36;
  var gear2 = gear.connect(3 * (W / 4), H / 2);
  function getMousePos(canvas, evnt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evnt.clientX - rect.left,
        y: evnt.clientY - rect.top
    };
  }

  canvas.onmousemove = function (evnt) {
    var pos = getMousePos(canvas, evnt);

    var x = Math.min(0.7 * W, Math.max(0.3 * W, pos.x));
    var y = Math.min(0.7 * H, Math.max(0.3 * H, pos.y));

    gear2 = gear.connect(x, y);
  }

  setInterval(function(){
    canvas.width = canvas.width;
    gear.render(context);
    gear2.render(context);
  })

})();