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

  var Gear = function(x, y, connectionRadius, legs, fillStyle, strokeStyle){
    this.x = x;
    this.y = y;
    this.connectionRadius = connectionRadius;
    this.legs = legs;

    this.fillStyle = fillStyle;
    this.strokeStyle = strokeStyle;

    this.diameter = legs * 4 * connectionRadius;
    this.radius = this.diameter / ( 2 * Math.PI );
    this.phi0 = 0;
    this.phi = 0;
    this.angularSpeed = 0;
    this.lastReset = new Date();
  }

  function createArc(shape, x, y, radius, from, to, sign, parts) {
    var src = sign ? from : to;
    var trg = sign ? to : from;
    var multiplier = sign ? 0 : Math.PI;

    for (var i = 1; i < parts; i++) {
        var t = i / parts;
        var cx = x + radius * Math.cos(multiplier + (src * (1 - t) + trg * t));
        var cy = y + radius * Math.sin(multiplier + (src * (1 - t) + trg * t));
        shape.lineTo(cx, cy);
    }
  }

  Gear.prototype.track = function track() {
      var ellapsed = new Date() - this.lastReset;
      var phiDegrees = this.angularSpeed * (ellapsed / 1000);
      this.phi = this.phi0 + deg2rad(phiDegrees);
  }

  Gear.prototype.getShape = function getShape(context) {
    if (this.shape) return this.shape;

    this.shape = new THREE.Shape();

    var sign = this.legs % 2;
    var from = -Math.PI / 2 + this.phi;
    var to = Math.PI / 2 + this.phi;
    var src = sign ? from : to;
    var trg = sign ? to : from;
    var delta = sign ? 0 : Math.PI;

    var x0 = Math.cos(this.phi) * this.radius + this.connectionRadius * Math.cos(delta + src);
    var y0 = Math.sin(this.phi) * this.radius + this.connectionRadius * Math.sin(delta + src);

    this.shape.moveTo(x0, y0);
    console.log(this.shape,this.legs); 

    for (var i = 0; i < this.legs * 2; i++) {
        var alpha = 2 * Math.PI * (i / (this.legs * 2)) + this.phi;
        var x = Math.cos(alpha) * this.radius;
        var y = Math.sin(alpha) * this.radius;

        createArc(this.shape, x, y, this.connectionRadius,
            -Math.PI / 2 + alpha, Math.PI / 2 + alpha, i % 2 == 0, 3);
    }

    var holePath = new THREE.Path();
    holePath.moveTo(this.connectionRadius, 0);
    createArc(holePath, 0, 0, this.connectionRadius, 0, 2 * Math.PI, true, 10);
    this.shape.holes.push(holePath);
    console.log(this.shape);

    return this.shape;
  }

  var extrudeSettings = {
    steps: 1,
    amount: 50,
    bevelEnabled: false,
  };


  var W = 300;
  var H = 300;
  var gear = new Gear(W, H, 30, 17, "rgba(61, 142, 198, 1)", "rgba(61, 142, 198, 1)")

  gear.angularSpeed = 36;

  var geometry = new THREE.ExtrudeGeometry(gear.getShape(), extrudeSettings);
  var material = new THREE.MeshPhongMaterial({
      color: "rgba(61, 142, 198, 1)",
      polygonOffset: true,
      polygonOffsetFactor: 1.0,
      polygonOffsetUnits: 4.0
  });

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, W / H, 1, 10000);
  camera.position.set(W / 2, -H / 2, 1200);
  camera.lookAt({ x: W / 2, y: -H / 2, z: 0 });

  // LIGHTS
  scene.add(new THREE.AmbientLight(0x444444));
  var light = new THREE.DirectionalLight(0xFFFFFF, 0.8);
  light.position.set(0, 0, 550);
  light.exponent = 0.5;
  light.castShadow = true;
  light.shadow.mapSize.width = light.shadow.mapSize.height = 2048;
  light.shadow.camera.near = 10;
  light.shadow.camera.far = 5000;
  light.shadow.camera.left = -5000;
  light.shadow.camera.light = 5000;
  light.shadow.camera.top = 5000;
  light.shadow.camera.bottom = -5000;
  scene.add(light);

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(W, H);
  renderer.setClearColor(0xFFFFFF, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMapSoft = false;
  renderer.shadowCameraNear = 0;
  renderer.shadowCameraFar = camera.far;
  renderer.shadowCameraFov = 100;
  renderer.shadowMapBias = 0.1;
  renderer.shadowMapDarkness = 0.3;
  renderer.shadowMapWidth = 2048;
  renderer.shadowMapHeight = 2048;
  var gbCanvas = document.getElementById("test");
  gbCanvas.appendChild(renderer.domElement);

  gbCanvas.onmousemove = function onMouseMove(e) {
      var dx = Math.min(e.offsetX, W * 3 / 4);
      dx = Math.max(dx, W / 4);

      var dy = Math.min(e.offsetY, H * 3 / 4);
      dy = Math.max(dy, H / 4);

      light.position.set(dx - W / 2, H / 2 - dy, 550);
  }

  var Mesh = new THREE.Mesh(geometry, material);
  Mesh.position.set(150,-150,0)
  scene.add(Mesh);

  var render = function () {
      requestAnimationFrame(render);
      gear.track();
      Mesh.rotation.z = -gear.phi;
      Mesh.rotation.y = -gear.phi;
      // console.log(gear.phi,mesh.rotation.z);
      renderer.render(scene, camera);
  };
  render();

})();