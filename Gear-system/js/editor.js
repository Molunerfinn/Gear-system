Zepto(function($){
  // TODO
  var canvas = document.getElementById('gear-system');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
  });
  renderer.setClearColor(0xffffff);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 10, 10000);
  camera.position.set(80,80,80);
  var gridHelper = new THREE.GridHelper(100,30, 0x0000ff, 0x808080);
  gridHelper.position.set(0,0,0);
  scene.add(gridHelper);

  pointLight = new THREE.PointLight(0xFFFFFF);
  pointLight.position.x = 10;
  pointLight.position.y = 50;
  pointLight.position.z = 130;

  scene.add(pointLight);


  // Add Frames Display
  var stats = new Stats();
  document.body.appendChild(stats.dom);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 1.0;
  controls.enableZoom = true;
  controls.addEventListener( 'change', draw );

  function renderCanvas(){
    stats.begin();
    stats.end();
    draw();
    controls.update();
    requestAnimationFrame(renderCanvas);
  }
  function draw(){
    // camera.lookAt(new THREE.Vector3(0,0,0))
    renderer.render(scene, camera);
  }
  renderCanvas();
})