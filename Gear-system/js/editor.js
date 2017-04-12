Zepto(function($){

  let canvas = document.getElementById('gear-system');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
  });
  renderer.setClearColor(0xeeeeee);
  let scene = new THREE.Scene();
  let camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 10, 10000);
  camera.position.set(80,80,80);
  let gridHelper = new THREE.GridHelper(100,30, 0x0000ff, 0x808080);
  gridHelper.position.set(0,0,0);
  scene.add(gridHelper);

  pointLight = new THREE.PointLight(0xFFFFFF);
  pointLight.position.x = 10;
  pointLight.position.y = 50;
  pointLight.position.z = 130;

  scene.add(pointLight);

  let Gear = new GEARS.Gear(0,0,1,17,"rgba(61,142,198,1)","rgba(61,142,198,1)"); 
  Gear.angularSpeed = 36;

  let extrudeSettings = {
    steps: 1,
    amount: 2,
    bevelEnabled: false
  }

  let geometry = new THREE.ExtrudeGeometry(Gear.getShape(),extrudeSettings);
  let material = new THREE.MeshPhongMaterial({
    color: "rgba(61,142,198,1)",
    polygonOffset: true,
    polygonOffseFactor: 1.0,
    polygonOffsetUnits: 4.0
  });

  let Mesh = new THREE.Mesh(geometry, material);
  Mesh.position.set(0,0,0);
  scene.add(Mesh);

  // Add Frames Display
  let stats = new Stats();
  document.body.appendChild(stats.dom);

  // Add controls
  let controls = new THREE.OrbitControls(camera, renderer.domElement); // renderer.domElement is required
  controls.enableDamping = true;
  controls.dampingFactor = 1.0;
  controls.enableZoom = true;
  controls.addEventListener( 'change', draw );

  let transControl = new THREE.TransformControls(camera, renderer.domElement);
  transControl.addEventListener('change', draw);
  transControl.attach(Mesh);
  scene.add(transControl);

  // Dat.gui control
  function initGuiControl(){
    let gui = new dat.GUI();

    let guiOption = {
      'Light X': pointLight.position.x,
      'Light Y': pointLight.position.y,
      'Light Z': pointLight.position.x
    }

    let lightFolder = gui.addFolder('Light');
    lightFolder.add(guiOption, 'Light X')
        .min(-2000).max(2000)
        .onChange(function (value) {
            pointLight.position.x = value;

        });
    lightFolder.add(guiOption, 'Light Y')
        .min(-2000).max(2000)
        .onChange(function (value) {
            pointLight.position.y = value;
        });
    lightFolder.add(guiOption, 'Light Z')
        .min(-2000).max(2000)
        .onChange(function (value) {
            pointLight.position.z = value;
        });
  }

  initGuiControl();

  // Render whole scene
  function renderCanvas(){
    stats.begin();
    draw();
    stats.end();
    controls.update();
    requestAnimationFrame(renderCanvas);
  }
  function draw(){
    Gear.track();
    Mesh.rotation.z = -Gear.phi;
    renderer.render(scene, camera);
  }
  renderCanvas();
})