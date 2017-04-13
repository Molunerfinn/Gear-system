Zepto(function($){

  let raycaster;
  let mouse;
  let SELECT;
  let objects = [];
  let canvas = document.getElementById('gear-system');
  let light;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
  });
  renderer.shadowMap.enabled = true; // for shadow & camera helper
  renderer.shadowMap.soft = true;
  renderer.setClearColor(0xeeeeee);
  let scene = new THREE.Scene();
  let camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 10, 10000);
  camera.position.set(80,80,80);
  let gridHelper = new THREE.GridHelper(100,30, 0x0000ff, 0x808080);
  gridHelper.position.set(0,0,0);
  scene.add(gridHelper);

  light = new THREE.SpotLight(0xFFFFFF,1);
  // light.position.x = 10;
  // light.position.y = 50;
  // light.position.z = 130;
  light.position.set(0,30,30);

  light.castShadow = true;
  light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(45,1,10,80))
  let helper = new THREE.CameraHelper( light.shadow.camera );
  // light.shadowCameraVisible = true;

  scene.add(light);

  // let gearOption = {
  //   size: 1,

  // }

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
    polygonOffsetUnits: 4.0
  });

  let Mesh = new THREE.Mesh(geometry, material);
  Mesh.position.set(0,0,0);
  Mesh.castShadow = true;
  Mesh.receiveShadow = true;
  objects.push(Mesh);
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


  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Added: click control
  function onTouchStart(event){
    event.preventDefault();
    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;
    onMouseDown(event); 
  }

  function onMouseDown(event){
    event.preventDefault();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y =  - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObjects(objects);
    if(intersects.length > 0){
      SELECT = intersects[0].object;
      transControl.attach(Mesh);
      scene.add(transControl);
    }else{
      scene.remove(transControl);
      transControl.detach(SELECT);
    }
  }

  document.addEventListener( 'mousedown', onMouseDown, false );
  document.addEventListener( 'touchstart', onTouchStart, false );

  // Dat.gui control
  function initGuiControl(){
    let gui = new dat.GUI();

    let lightOption = {
      'Light X': light.position.x,
      'Light Y': light.position.y,
      'Light Z': light.position.x,
      'Camera Helper': false
    }

    // light folder
    let lightFolder = gui.addFolder('Light');
    lightFolder.add(lightOption, 'Light X')
        .min(0).max(200)
        .onChange((value) => {
            light.position.x = value;

        });
    lightFolder.add(lightOption, 'Light Y')
        .min(0).max(200)
        .onChange((value) => {
            light.position.y = value;
        });
    lightFolder.add(lightOption, 'Light Z')
        .min(0).max(200)
        .onChange((value) => {
            light.position.z = value;
        });
    lightFolder.add(lightOption, 'Camera Helper')
        .onChange((value) => {
          value == true ? scene.add(helper) : scene.remove(helper);
          value == true ? Gear.angularSpeed = 0 : Gear.angularSpeed = 36;
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