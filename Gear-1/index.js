(function(){
  function deg2rad(d){
    return (2 * Math.PI * d) / 360;
  }

  function rad2deg(r){
    return (360 * r) / (2 * Math.PI);
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

  var canvas = document.getElementById('myCanvas');
  var context = canvas.getContext('2d');
  var W = canvas.width;
  var H = canvas.height;
  var gear = new Gear(W / 2, H / 2, 5, 12, "white", "rgba(61, 142, 198, 1)")
  gear.angularSpeed = 36;
  setInterval(function(){
    canvas.width = canvas.width;
    gear.render(context);
  })

})();