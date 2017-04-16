Zepto(function($){

  let raycaster;
  let mouse;
  let SELECT;
  let objects = [];
  let canvas = document.getElementById('gear-system');
  let light;
  let Gear;
  let Gears = [];
  let Mesh;
  let Meshes = [];
  let gearOption = {};
  let gearOptions = [];
  // let material;
  // let geometry;
  let stopFlag = false;
  let rotation;
  let isMobile = false;
  let markedMesh;
  let gui;

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
  let gridHelper = new THREE.GridHelper(100,50, 0x0000ff, 0x808080);
  gridHelper.position.set(0,0,0);
  scene.add(gridHelper);

  light = new THREE.SpotLight(0xFFFFFF,1);
  light.position.set(0,30,30);

  light.castShadow = true;
  light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(45,1,10,80))
  let helper = new THREE.CameraHelper( light.shadow.camera );

  scene.add(light);

  gearOption = {
    teeth: 0,
    modulus: 0,
    color: "#3d8ec6",
    speed: 0,
    steps: 0,
    amount: 0,
    thinkness: 0,
    bevelEnabled: false,
  }

  function renderGear(){
    let gear = new GEARS.Gear(0,0,gearOption.modulus / 4, gearOption.teeth,gearOption.color,gearOption.color); 
    gear.angularSpeed = gearOption.speed;
    let geometry = new THREE.ExtrudeGeometry(gear.getShape(),gearOption);
    let material = new THREE.MeshPhongMaterial({
      color: gearOption.color,
      polygonOffset: true,
      polygonOffsetUnits: 4.0
    });
    return {
      geometry: geometry,
      material: material,
      gear: gear
    }
  }

  function addGear(x,y,z){
    let X = x || 30 - Math.random() * 60;
    let Y = y || 30 - Math.random() * 60;
    let Z = z || 30 - Math.random() * 60;
    let tempOption = {
      teeth: 17,
      modulus: 4,
      color: "#3d8ec6",
      speed: 36,
      steps: 1,
      amount: 2,
      thinkness: 2,
      bevelEnabled: false,
      uuid: ''
    }
    let gear = new GEARS.Gear(0,0,tempOption.modulus / 4, tempOption.teeth,tempOption.color,tempOption.color); 
    gear.angularSpeed = tempOption.speed;

    let tempGeometry = new THREE.ExtrudeGeometry(gear.getShape(),tempOption);
    let tempMaterial = new THREE.MeshPhongMaterial({
      color: tempOption.color,
      polygonOffset: true,
      polygonOffsetUnits: 4.0
    });

    let mesh = new THREE.Mesh(tempGeometry, tempMaterial);
    mesh.position.set(X,Y,Z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    tempOption.uuid = mesh.uuid;
    gear.uuid = mesh.uuid;
    Meshes.push(mesh);
    Gears.push(gear);
    gearOptions.push(tempOption);
    scene.add(mesh);
  }

  addGear(0.5,0.5,0.5);

  function removeGear(ms){
    if(ms != undefined){
      scene.remove(ms);
      let uuid = ms.uuid;
      for(let i in Meshes){
        if(Meshes[i].uuid == uuid){
          Meshes.splice(i,1)
        }
      }
      for(let i in Gears){
        if(Gears[i].uuid == uuid){
          Gears.splice(i,1)
        }
      }
      for(let i in gearOptions){
        if(gearOptions[i].uuid == uuid){
          gearOptions.splice(i,1)
        }
      }
      markedMesh = undefined;
    }
  }

  rotation = {
    x: 0,
    y: 0,
    z: 0 
  }

  function updateMesh(ms){
    if(ms != undefined){
      rotation = {
        x: ms.rotation.x,
        y: ms.rotation.y,
        z: ms.rotation.z
      }
      let uuid = ms.uuid;
      let position = Mesh.position;
      scene.remove(ms);
      removeItem(Meshes,uuid);
      let go = getGearAndOptFromMesh(ms);
      for(let i in gearOption){
        go.gearOption[i] = gearOption[i];
      }
      let _gear = renderGear();
      let mesh = new THREE.Mesh(_gear.geometry, _gear.material);
      mesh.position.set(position.x,position.y,position.z);
      mesh.rotation.set(rotation.x,rotation.y,rotation.z);
      removeItem(Gears,uuid);
      removeItem(gearOptions,uuid);
      _gear.gear.uuid = mesh.uuid;
      go.gearOption.uuid = mesh.uuid;
      Meshes.push(mesh);
      Gears.push(_gear.gear);
      gearOptions.push(go.gearOption);
      markedMesh = mesh;
      Mesh = mesh;
      scene.add(mesh);
    }
  }

  function removeItem(item,uuid){
    for(let i in item){
      if(item[i].uuid == uuid){
        item.splice(i,1)
      }
    }
  }

  // Add Frames Display
  let stats = new Stats();
  document.body.appendChild(stats.dom);

  // Add controls
  let controls = new THREE.OrbitControls(camera, renderer.domElement); // renderer.domElement is required
  controls.enableDamping = true;
  controls.dampingFactor = 1.0;
  controls.enableZoom = true;
  controls.addEventListener( 'change', draw );
  controls.addEventListener( 'change', draw );

  let transControl = new THREE.TransformControls(camera, renderer.domElement);
  transControl.addEventListener('change', draw);


  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();


  // Mobile detected
  function detectedMobile(){
    var sUserAgent= navigator.userAgent.toLowerCase(),
    bIsIpad= sUserAgent.match(/ipad/i) == "ipad",
    bIsIphoneOs= sUserAgent.match(/iphone os/i) == "iphone os",
    bIsMidp= sUserAgent.match(/midp/i) == "midp",
    bIsUc7= sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4",
    bIsUc= sUserAgent.match(/ucweb/i) == "ucweb",
    bIsAndroid= sUserAgent.match(/android/i) == "android",
    bIsCE= sUserAgent.match(/windows ce/i) == "windows ce",
    bIsWM= sUserAgent.match(/windows mobile/i) == "windows mobile",
    bIsWebview = sUserAgent.match(/webview/i) == "webview";
    return (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM);
  }

  isMobile = detectedMobile();

  // Dat.gui control
  function initGuiControl(){
    gui = new dat.GUI();

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
          value == true ? stopFlag = true : stopFlag = false;
        });
    let gearFolder = gui.addFolder('Gear');
    gearFolder.add(gearOption, 'teeth')
        .min(10).max(40).step(1)
        .onChange((value) => {
          gearOption.teeth = value;
          updateMesh(Mesh);
        }).listen();
    gearFolder.add(gearOption, 'modulus')
        .min(2).max(10).step(1)
        .onChange((value) => {
          gearOption.modulus = value;
          updateMesh(Mesh);
        }).listen();
    gearFolder.add(gearOption, 'thinkness')
        .min(0.1).max(25).step(0.1)
        .onChange((value) => {
          gearOption.amount = value;
          gearOption.thinkness = value;
          updateMesh(Mesh);
        }).listen();
    gearFolder.add(gearOption, 'speed')
        .min(0.1).max(96).step(0.1)
        .onChange((value) => {
          gearOption.speed = value;
          updateMesh(Mesh);
        }).listen();
    gearFolder.addColor(gearOption, 'color')
        .onChange((value) => {
          gearOption.color = value;
          updateMesh(Mesh);
        }).listen();
    if(!isMobile){
      lightFolder.open();
      gearFolder.open();
    }else{
      $('.button').addClass('mobile-button')
    }
  }

  initGuiControl();

  function updateGearParameters(){
    let l = ['x','y','z'];
    if(Mesh!= undefined){
      for(let i in l){
        $('.position-' + l[i]).text(Mesh.position[l[i]].toFixed(2));
      }
    }
  }

  // Render whole scene
  function renderCanvas(){
    stats.begin();
    draw();
    stats.end();
    controls.update();
    requestAnimationFrame(renderCanvas);
  }
  function draw(){
    for(let i in Meshes){
      let go = getGearAndOptFromMesh(Meshes[i]);
      go.gear.track();
      Meshes[i].rotation.z = - go.gear.phi;
    }
    let go = getGearAndOptFromMesh(markedMesh);
    if(go != undefined){
      for(let i in go.gearOption){
        gearOption[i] = go.gearOption[i];
      }
      for(let i in gui.__controllers){
        gui.__controllers[i].updateDisplay();
      }
    }
    updateGearParameters();
    renderer.render(scene, camera);
  }

  // Get Gear & Option infomation from mesh
  function getGearAndOptFromMesh(ms){
    if(ms != undefined){
      let uuid = ms.uuid;
      let _gear;
      let _option;
      for(let i in Gears){
        Gears[i].uuid == uuid ? _gear = Gears[i] : '';
      }
      for(let i in gearOptions){
        gearOptions[i].uuid == uuid ? _option = gearOptions[i] : '';
      }
      return {
        gear: _gear,
        gearOption: _option
      }
    }else{
      return undefined
    }
  }

  renderCanvas()
  
  // Dom Events
  $('.toggle-menu').on('click',function(){
    $('#function-panel').hasClass('hide') ? $('#function-panel').removeClass('hide').addClass('show') : $('#function-panel').removeClass('show').addClass('hide');
  });

  $('.add-gear').on('click',function(){
    addGear();
  })
  $('.remove-gear').on('click',function(){
    removeGear(markedMesh);
  })
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
    let intersects = raycaster.intersectObjects(Meshes);
    if(intersects.length > 0){
      Mesh = intersects[0].object;
      transControl.attach(Mesh);
      scene.add(transControl);
      isMobile ? controls.enabled = false : '';
      markedMesh = Mesh;
    }else{
      scene.remove(transControl);
      transControl.detach(SELECT);
      isMobile ? controls.enabled = true : '';
    }
  }

  document.addEventListener( 'mousedown', onMouseDown, false );
  renderer.domElement.addEventListener( 'touchstart', onTouchStart, false );
})