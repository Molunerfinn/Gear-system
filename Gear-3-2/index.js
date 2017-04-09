var GEARS = function() {
    function Color(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    Color.prototype.interpolate = function interpolate(other, t) {
        return new Color(this.r * t + other.r * (1 - t),this.g * t + other.g * (1 - t),this.b * t + other.b * (1 - t));
    }
    Color.prototype.add = function add(other) {
        return new Color(Math.max(0, Math.min(1, this.r + other.r)),Math.max(0, Math.min(1, this.g + other.g)),Math.max(0, Math.min(1, this.b + other.b)));
    }
    Color.prototype.get = function get() {
        return 'rgb(' + Math.floor(255 * this.r) + ',' + Math.floor(255 * this.g) + ',' + Math.floor(255 * this.b) + ')';
    }
    function FakeRandom(seed) {
        this.x = seed;
        this.a = 2147483629;
        this.c = 2147483587;
        this.m = Math.pow(2, 31) - 1;
    }
    FakeRandom.prototype.random = function random() {
        this.x = (this.c * this.x + this.a) % this.m;
        return this.x / this.m;
    }
    FakeRandom.prototype.set = function set(seed) {
        this.x = seed;
    }
    function deg2rad(d) {
        return (2 * Math.PI * d) / 360;
    }
    function rad2deg(r) {
        return (360 * r) / (2 * Math.PI);
    }
    function distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }
    function maxLegsFromRadius(radius, connectionRadius) {
        var diameter = radius * 2 * Math.PI;
        var legs = diameter / (4 * connectionRadius);
        return legs;
    }
    function Gear(x, y, connectionRadius, legs, fillStyle, strokeStyle) {
        this.x = x;
        this.y = y;
        this.exact = true;
        this.connectionRadius = connectionRadius;
        this.legs = legs;
        this.diameter = legs * 4 * connectionRadius;
        this.radius = this.diameter / (2 * Math.PI);
        this.phi0 = 0;
        this.phi = 0;
        this.angularSpeed = 0;
        this.lastReset = new Date();
        this.fillStyle = fillStyle;
        this.strokeStyle = strokeStyle;
    }
    Gear.prototype.adjustSpeed = function adjustSpeed(newSpeed) {
        this.phi0 = this.phi;
        this.lastReset = new Date();
        this.angularSpeed = newSpeed;
    }
    Gear.prototype.track = function track() {
        var ellapsed = new Date() - this.lastReset;
        var phiDegrees = this.angularSpeed * (ellapsed / 1000);
        this.phi = this.phi0 + deg2rad(phiDegrees);
    }
    Gear.prototype.render = function render(context) {
        this.track();
        this.draw(context);
    }
    Gear.prototype.draw = function draw(context) {
        context.beginPath();
        for (var i = 0; i < this.legs * 2; i++) {
            var alpha = 2 * Math.PI * (i / (this.legs * 2)) + this.phi;
            var x = this.x + Math.cos(alpha) * this.radius;
            var y = this.y + Math.sin(alpha) * this.radius;
            context.arc(x, y, this.connectionRadius, -Math.PI / 2 + alpha, Math.PI / 2 + alpha, i % 2 == 0);
        }
        context.lineCap = 'round';
        context.lineWidth = 1;
        context.fillStyle = this.fillStyle.get();
        context.fill();
        context.strokeStyle = this.strokeStyle.get();
        context.stroke();
        context.beginPath();
        context.arc(this.x, this.y, this.connectionRadius, 0, 2 * Math.PI, true);
        context.fillStyle = this.fillStyle;
        context.fill();
        context.strokeStyle = this.strokeStyle
        context.stroke();
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
    Gear.prototype.getShape = function getShape(context) {
        if (this.shape)
            return this.shape;
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
        for (var i = 0; i < this.legs * 2; i++) {
            var alpha = 2 * Math.PI * (i / (this.legs * 2)) + this.phi;
            var x = Math.cos(alpha) * this.radius;
            var y = Math.sin(alpha) * this.radius;
            createArc(this.shape, x, y, this.connectionRadius, -Math.PI / 2 + alpha, Math.PI / 2 + alpha, i % 2 == 0, 3);
        }
        var holePath = new THREE.Path();
        holePath.moveTo(this.connectionRadius, 0);
        createArc(holePath, 0, 0, this.connectionRadius, 0, 2 * Math.PI, true, 10);
        this.shape.holes.push(holePath);
        return this.shape;
    }
    Gear.prototype.connect = function connect(x, y) {
        var r = this.radius;
        var dist = distance(x, y, this.x, this.y);
        var alpha = Math.atan2(y - this.y, x - this.x);
        var newRadius = Math.max(dist - r, 10);
        var newDiam = newRadius * 2 * Math.PI;
        var newLegs = Math.round(newDiam / (4 * this.connectionRadius));
        var actualDiameter = newLegs * 4 * this.connectionRadius;
        var actualRadius = actualDiameter / (2 * Math.PI);
        var actualDist = r + actualRadius;
        var actualX = this.x + Math.cos(alpha) * actualDist;
        var actualY = this.y + Math.sin(alpha) * actualDist;
        var variance = distance(actualX, actualY, x, y);
        var gearRatio = this.legs / newLegs;
        var newGear = new Gear(actualX,actualY,this.connectionRadius,newLegs,this.fillStyle,this.strokeStyle);
        newGear.angularSpeed = -this.angularSpeed * gearRatio;
        if (variance > 2)
            newGear.exact = false;
        newGear.phi0 = alpha + Math.PI + (Math.PI / newLegs) + (this.phi0 - alpha) * (deg2rad(1 * newGear.angularSpeed) / deg2rad(1 * this.angularSpeed));
        return newGear;
    }
    function GearsLayer(connectionRadius, startLegs, fillStyle, strokeStyle) {
        this.connectionRadius = connectionRadius;
        this.startLegs = startLegs;
        this.gears = [];
        this.fillStyle = fillStyle;
        this.strokeStyle = strokeStyle;
        this.minLegs = 4;
        this.minFps = 1;
    }
    GearsLayer.prototype.detectCollision = function detectCollision(newGear, neighbor) {
        var result = false;
        var that = this;
        this.gears.forEach(function(gear) {
            var dist = distance(gear.x, gear.y, newGear.x, newGear.y);
            if (dist < gear.radius + newGear.radius + 2 * that.connectionRadius + 5 && neighbor != gear) {
                result = true;
            }
        });
        return result;
    }
    GearsLayer.prototype.nn = function nn(x, y, maxR) {
        var result = null;
        var minDist = 10000;
        var that = this;
        this.gears.forEach(function(gear) {
            var dist = distance(x, y, gear.x, gear.y) - gear.radius;
            var newGear = gear.connect(x, y);
            var rSpeed = newGear.angularSpeed * newGear.radius;
            if (that.minFps * rSpeed < newGear.diameter) {
                if (newGear.radius < maxR && newGear.legs >= that.minLegs) {
                    if (!that.detectCollision(newGear, gear)) {
                        if (dist < minDist) {
                            minDist = dist;
                            result = newGear;
                            if (newGear.legs == that.minLegs) {
                                that.minLegs++;
                            }
                        }
                    }
                }
            }
        });
        return result;
    }
    GearsLayer.prototype.tryAdd = function tryAdd(x, y, maxR) {
        if (this.gears.length == 0) {
            var newGear = new Gear(x,y,this.connectionRadius,this.startLegs,this.fillStyle,this.strokeStyle);
            newGear.angularSpeed = 360 / newGear.legs;
            this.gears.push(newGear);
        } else {
            var newGear = this.nn(x, y, maxR);
            if (newGear != null) {
                this.gears.push(newGear);
            }
        }
    }
    GearsLayer.prototype.addAtRandom = function addAtRandom(maxGears, options, maxR) {
        var retries = 0;
        var maxX = options.maxX;
        var maxY = options.maxY;
        var minX = options.minX;
        var minY = options.minY;
        while (this.gears.length < maxGears && retries < options.qouta) {
            var x = options.generator.random() * (maxX - minX) + minX;
            var y = options.generator.random() * (maxY - minY) + minY;
            this.tryAdd(x, y, maxR);
            retries++;
        }
    }
    GearsLayer.prototype.tryAddFromLayer = function tryAddFromLayer(x, y, legs, angularSpeed) {
        var newGear = new Gear(x,y,this.connectionRadius,legs,this.fillStyle,this.strokeStyle);
        var rSpeed = angularSpeed * newGear.radius;
        if (!this.detectCollision(newGear, null) && this.minFps * rSpeed < newGear.diameter) {
            newGear.angularSpeed = angularSpeed;
            this.gears.push(newGear);
        }
    }
    GearsLayer.prototype.addFromLayer = function addFromLayer(layers, options, maxR) {
        var retries = 0;
        while (this.gears.length < options.maxGears && retries < options.qouta) {
            var layerIdx = Math.floor((options.generator.random() * layers.length));
            var layer = layers[layerIdx];
            var gearIdx = Math.floor((options.generator.random() * layer.gears.length));
            var gear = layer.gears[gearIdx];
            var legs = options.minLegs + Math.floor((options.generator.random() * (maxLegsFromRadius(maxR, this.connectionRadius) - options.minLegs)));
            this.tryAddFromLayer(gear.x, gear.y, legs, gear.angularSpeed);
            retries++;
        }
    }
    function LayerStackCreationOptions() {
        this.farColor = new Color(0,0.35,0.60);
        this.nearColor = new Color(0.4,0.7,0.9);
        this.qouta = 1000;
        this.count = 1;
        this.maxGears = 1000;
        this.generator = new FakeRandom(1235);
        this.minX = 0;
        this.minY = 0;
        this.maxX = 700;
        this.maxY = 600;
        this.connectionRadius = 10;
        this.minLegs = 4;
        this.firstGearLegs = 10;
    }
    LayerStackCreationOptions.prototype.create = function create(options) {
        var layers = [];
        var layerQuota = (this.qouta / this.count) / 2;
        var farColor = this.farColor;
        var nearColor = this.nearColor;
        for (var i = 0; i < this.count; i++) {
            var t = i / this.count;
            var maxR = 200 - t * 100;
            var maxGears = this.maxGears / this.count;
            var clr = nearColor.interpolate(farColor, t);
            var borderClr = clr.add(new Color(0.3,0.3,0.3));
            var layer = new GearsLayer(this.connectionRadius,this.firstGearLegs,clr,borderClr);
            if (layers.length > 0) {
                layer.addFromLayer(layers, this, maxR);
            }
            layer.addAtRandom(maxGears, this, maxR);
            layers.push(layer);
        }
        return layers;
    }
    return {
        Gear: Gear,
        GearsLayer: GearsLayer,
        LayerStackCreationOptions: LayerStackCreationOptions
    };
}();
var gearbox3dModule = function(canvasName) {
    var seed = 334563;
    var Gear = GEARS.Gear;
    var GearsLayer = GEARS.GearsLayer;
    var LayerStackCreationOptions = GEARS.LayerStackCreationOptions;
    var gbCanvas = document.getElementById(canvasName);
        var width = 600;
        var height = 500;
        var gearDepth = 150;
        gbCanvas.onmousemove = function onMouseMove(e) {
            var dx = Math.min(e.offsetX, width * 3 / 4);
            dx = Math.max(dx, width / 4);
            var dy = Math.min(e.offsetY, height * 3 / 4);
            dy = Math.max(dy, height / 4);
            light.position.set(dx - width / 2, height / 2 - dy, 550);
        }
        var mouse = new THREE.Vector2();
        var offset = new THREE.Vector3(10,10,10);
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(50,width / height,1,10000);
        camera.position.set(width / 2, -height / 2, 900);
        camera.lookAt({
            x: width / 2,
            y: -height / 2,
            z: 0
        });
        scene.add(new THREE.AmbientLight(0x444444));
        var light = new THREE.DirectionalLight(0xFFFFFF,0.8);
        light.position.set(0, 0, 550);
        light.exponent = 0.5;
        light.castShadow = true;
        light.shadow.mapSize.width = light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 10;
        light.shadow.camera.far = 5000;
        light.shadow.camera.left = -5000;
        light.shadow.camera.right = 5000;
        light.shadow.camera.top = 5000;
        light.shadow.camera.bottom = -5000;
        scene.add(light);
        var renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        renderer.setSize(width, height);
        renderer.setClearColor(0xFFFFFF, 1);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMapSoft = false;
        renderer.shadowCameraNear = 0;
        renderer.shadowCameraFar = camera.far;
        renderer.shadowCameraFov = 100;
        renderer.shadowMapBias = 0.1;
        renderer.shadowMapWidth = 2048;
        renderer.shadowMapHeight = 2048;
        gbCanvas.appendChild(renderer.domElement);
        var options = new GEARS.LayerStackCreationOptions();
        options.minX = 50;
        options.minY = 50;
        options.maxX = width - 50;
        options.maxY = height - 50;
        options.maxGears = 30;
        options.connectionRadius = 5;
        options.generator.set(seed);
        var layers = options.create();
        var group = new THREE.Group();
        var i = 0;
        layers.forEach(function(layer) {
            layer.gears.forEach(function(gear) {
                gear.track();
                gear.group = addShape(gear.getShape(), gear.fillStyle.get(), gear.strokeStyle.get(), 0, 0, 0, 0, 0, -gear.phi, 1);
                gear.group.position.x = gear.x;
                gear.group.position.y = -gear.y;
                gear.group.position.z = i * gearDepth;
                group.add(gear.group);
            });
            i++;
        });
        var plane = new THREE.Shape();
        plane.moveTo(0, 0);
        plane.lineTo(width, 0);
        plane.lineTo(width, height);
        plane.lineTo(0, height);
        var geometry = new THREE.ShapeGeometry(plane);
        var material = new THREE.MeshLambertMaterial({
            color: 0xFFFFFF,
            wireframe: false
        });
        var mesh = new THREE.Mesh(geometry,material);
        mesh.position.set(-10000, -10000, -50);
        mesh.rotation.set(0, 0, 0);
        mesh.scale.set(200, 200, 1);
        mesh.receiveShadow = true;
        scene.add(mesh);
        scene.add(group);
        var render = function() {
            requestAnimationFrame(render);
            layers.forEach(function(layer) {
                layer.gears.forEach(function(gear) {
                    gear.track();
                    gear.group.rotation.z = -gear.phi;
                });
            });
            renderer.render(scene, camera);
        };
        render();
        function addShape(shape, color, strokeColor, x, y, z, rx, ry, rz, s) {
            var group = new THREE.Group();
            var extrudeSettings = {
                steps: 1,
                amount: gearDepth,
                bevelEnabled: false,
            };
            var geometry = new THREE.ExtrudeGeometry(shape,extrudeSettings);
            var material = new THREE.MeshPhongMaterial({
                color: color,
                polygonOffset: true,
                polygonOffsetFactor: 1.0,
                polygonOffsetUnits: 4.0
            });
            var mesh = new THREE.Mesh(geometry,material);
            mesh.position.set(x, y, z);
            mesh.rotation.set(rx, ry, rz);
            mesh.scale.set(s, s, s);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
            var geometry = shape.createPointsGeometry();
            var material = new THREE.LineBasicMaterial({
                linewidth: 10,
                color: strokeColor,
                transparent: false
            });
            var line = new THREE.Line(geometry,material);
            line.position.set(x, y, z + gearDepth);
            line.rotation.set(rx, ry, rz);
            line.scale.set(s, s, s);
            group.add(line);
            return group;
        }
}("test");
