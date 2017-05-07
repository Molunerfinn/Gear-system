Zepto(function($){

  var raycaster;
  var mouse;
  var SELECT;
  var objects = [];
  var canvas = document.getElementById('gear-system');
  var light;
  var Gear;
  var Gears = [];
  var Mesh;
  var Meshes = [];
  var gearOption = {};
  var gearOptions = [];
  var stopFlag = false;
  var rotation;
  var isMobile = false;
  var markedMesh;
  var gui;
  var boxes = [];

  // Add Frames Display
  var stats = new Stats();
  document.body.appendChild(stats.dom);

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
  });
  renderer.shadowMap.enabled = true; // for shadow & camera helper
  renderer.shadowMap.soft = true;
  renderer.setClearColor(0xeeeeee);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 10, 10000);
  camera.position.set(150,150,150);
  var gridHelper = new THREE.GridHelper(1000,50, 0x0000ff, 0x808080);
  gridHelper.position.set(0,0,0);
  scene.add(gridHelper);

  light = new THREE.SpotLight(0xFFFFFF,1);
  light.position.set(0,200,200);

  light.castShadow = true;
  light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(45,1,100,800))
  var helper = new THREE.CameraHelper( light.shadow.camera );

  scene.add(light);

  // init gearOption
  gearOption = {
    teeth: 0,
    modulus: 0,
    color: "#3d8ec6",
    speed: 0,
    steps: 0,
    amount: 0,
    thinkness: 20,
    bevelEnabled: false,
  }

  // render functions
  function renderGear(){
    var gear = new GEARS.Gear(0,0,gearOption.modulus / 4, gearOption.teeth,gearOption.color,gearOption.color); 
    gear.angularSpeed = gearOption.speed;
    var geometry = new THREE.ExtrudeGeometry(gear.getShape(),gearOption);
    var material = new THREE.MeshPhongMaterial({
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
    var X = x || 150 - Math.random() * 300;
    var Y = y || 150 - Math.random() * 300;
    var Z = z || 150 - Math.random() * 300;
    var tempOption = {
      teeth: 17,
      modulus: 4,
      color: "#3d8ec6",
      speed: 36,
      steps: 1,
      amount: 2,
      thinkness: 20,
      bevelEnabled: false,
      uuid: ''
    }
    var gear = new GEARS.Gear(0,0,tempOption.modulus / 4, tempOption.teeth,tempOption.color,tempOption.color); 
    gear.angularSpeed = tempOption.speed;

    var tempGeometry = new THREE.ExtrudeGeometry(gear.getShape(),tempOption);
    var tempMaterial = new THREE.MeshPhongMaterial({
      color: tempOption.color,
      polygonOffset: true,
      polygonOffsetUnits: 4.0
    });

    var mesh = new THREE.Mesh(tempGeometry, tempMaterial);
    mesh.position.set(X,Y,Z);
    mesh.scale.set(5,5,5)
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    tempOption.uuid = mesh.uuid;
    gear.uuid = mesh.uuid;
    mesh.userData = 'gear'
    Meshes.push(mesh);
    Gears.push(gear);
    gearOptions.push(tempOption);
    scene.add(mesh);
  }

  addGear(0.5,0.5,0.5);

  function removeGear(ms){
    if(ms != undefined){
      scene.remove(ms);
      var uuid = ms.uuid;
      for(var i in Meshes){
        if(Meshes[i].uuid == uuid){
          Meshes.splice(i,1)
        }
      }
      for(var i in Gears){
        if(Gears[i].uuid == uuid){
          Gears.splice(i,1)
        }
      }
      for(var i in gearOptions){
        if(gearOptions[i].uuid == uuid){
          gearOptions.splice(i,1)
        }
      }
      markedMesh = undefined;
    }
  }

  var modelOption = {
    x: 0,
    y: 0,
    z: 0,
    scale: 0.2,
    rotationx: 0,
    rotationy: 0,
    rotationz: 0,
  }

  function addModel(){
    if(isMobile){
      var objLoader = new THREE.OBJLoader();
      objLoader.setPath('../model/');
      objLoader.load('file.obj', function(obj){
        obj.name = 'file.obj';
        for(var i = 0; i < obj.children.length; i++){
          Meshes.push(obj.children[i])
        }
        obj.scale.set(0.2,0.2,0.2)
        scene.add(obj);
      })
    }else{
      var fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.addEventListener('change', function(e){
        var file = fileInput.files[0];
        var filename = file.name;
        var reader = new FileReader();
        reader.addEventListener('load', function(e){
          var contents = e.target.result;
          var obj = new THREE.OBJLoader().parse(contents);
          obj.name = filename;
          for(var i = 0; i < obj.children.length; i++){
            Meshes.push(obj.children[i])
          }
          obj.scale.set(0.2,0.2,0.2)
          scene.add(obj);
        })
        reader.readAsText( file );
      })
      fileInput.click();
    }
  }

  function removeModel(){
    if(Mesh != undefined && Mesh.parent != undefined && Mesh.userData != "gear"){
      scene.remove(Mesh.parent);
      for(var i in Meshes){
        if(Meshes[i].parent != undefined && Mesh[i].userData != "gear"){
          Meshes.slice(i,1);
        }
      }
    }
  }

  function removeModelItem(){
    if(Mesh != undefined && Mesh.parent != undefined && Mesh.userData != "gear"){
      var uuid = Mesh.uuid;
      Mesh.parent.remove(Mesh);
      scene.remove(Mesh);
      for(var i in Meshes){
        if(Meshes[i].uuid == uuid){
          Meshes.slice(i,1);
        }
      }
    }
  }

  // init rotation
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
      var uuid = ms.uuid;
      var position = Mesh.position;
      scene.remove(ms);
      removeItem(Meshes,uuid);
      var go = getGearAndOptFromMesh(ms);
      if(go.gear != undefined || go.gearOption != undefined){
        for(var i in gearOption){
          go.gearOption[i] = gearOption[i];
        }
        var _gear = renderGear();
        var mesh = new THREE.Mesh(_gear.geometry, _gear.material);
        mesh.position.set(position.x,position.y,position.z);
        mesh.rotation.set(rotation.x,rotation.y,rotation.z);
        mesh.scale.set(5,5,5);
        removeItem(Gears,uuid);
        removeItem(gearOptions,uuid);
        _gear.gear.uuid = mesh.uuid;
        go.gearOption.uuid = mesh.uuid;
        mesh.userData = 'gear';
        Meshes.push(mesh);
        Gears.push(_gear.gear);
        gearOptions.push(go.gearOption);
        markedMesh = mesh;
        Mesh = mesh;
        scene.add(mesh);
      }
    }
  }

  function updateModel(ms,value){
    ms.parent.position.set(modelOption.x,modelOption.y,modelOption.z);
    ms.parent.scale.set(modelOption.scale,modelOption.scale,modelOption.scale);
    ms.parent.rotation.set(modelOption.rotationx,modelOption.rotationy,modelOption.rotationz);
  }

  // Add controls
  var controls = new THREE.OrbitControls(camera, renderer.domElement); // renderer.domElement is required
  controls.enableDamping = true;
  controls.dampingFactor = 1.0;
  controls.enableZoom = true;
  controls.addEventListener( 'change', draw );

  var transControl = new THREE.TransformControls(camera, renderer.domElement);
  transControl.addEventListener('change', draw);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Dat.gui control
  function initGuiControl(){
    gui = new dat.GUI();

    var lightOption = {
      'Light X': light.position.x,
      'Light Y': light.position.y,
      'Light Z': light.position.x,
      'Camera Helper': false
    }

    // light folder
    var lightFolder = gui.addFolder('Light');
    lightFolder.add(lightOption, 'Light X')
        .min(0).max(2000)
        .onChange(function(value){
            light.position.x = value;
        });
    lightFolder.add(lightOption, 'Light Y')
        .min(0).max(2000)
        .onChange(function(value){
            light.position.y = value;
        });
    lightFolder.add(lightOption, 'Light Z')
        .min(0).max(2000)
        .onChange(function(value){
            light.position.z = value;
        });
    lightFolder.add(lightOption, 'Camera Helper')
        .onChange(function(value){
          value == true ? scene.add(helper) : scene.remove(helper);
          value == true ? stopFlag = true : stopFlag = false;
        });
    var gearFolder = gui.addFolder('Gear');
    gearFolder.add(gearOption, 'teeth')
        .min(10).max(40).step(1)
        .onChange(function(value){
          gearOption.teeth = value;
          updateMesh(Mesh);
        }).listen();
    gearFolder.add(gearOption, 'modulus')
        .min(2).max(10).step(1)
        .onChange(function(value){
          gearOption.modulus = value;
          updateMesh(Mesh);
        }).listen();
    gearFolder.add(gearOption, 'thinkness')
        .min(0.1).max(25).step(0.1)
        .onChange(function(value){
          gearOption.amount = value;
          gearOption.thinkness = value;
          updateMesh(Mesh);
        }).listen();
    gearFolder.add(gearOption, 'speed')
        .min(0.1).max(96).step(0.1)
        .onChange(function(value){
          gearOption.speed = value;
          updateMesh(Mesh);
        }).listen();
    gearFolder.addColor(gearOption, 'color')
        .onChange(function(value){
          gearOption.color = value;
          updateMesh(Mesh);
        }).listen();
    var modelFolder = gui.addFolder('Model');
    modelFolder.add(modelOption, 'x')
      .min(-500).max(500).step(0.5)
      .onChange(function(value){
        updateModel(Mesh,'x');
      }).listen();
    modelFolder.add(modelOption, 'y')
      .min(-500).max(500).step(0.5)
      .onChange(function(value){
        updateModel(Mesh,'y');
      }).listen();
    modelFolder.add(modelOption, 'z')
      .min(-500).max(500).step(0.5)
      .onChange(function(value){
        updateModel(Mesh,'z');
      }).listen();
    modelFolder.add(modelOption, 'scale')
      .min(0.1).max(1.5).step(0.1)
      .onChange(function(value){
        updateModel(Mesh,'scale');
      }).listen();
    modelFolder.add(modelOption, 'rotationx')
      .min(-Math.PI).max(Math.PI).step(0.1)
      .onChange(function(value){
        updateModel(Mesh,'rotationx');
      }).listen();
    modelFolder.add(modelOption, 'rotationy')
      .min(-Math.PI).max(Math.PI).step(0.1)
      .onChange(function(value){
        updateModel(Mesh,'rotationy');
      }).listen();
    modelFolder.add(modelOption, 'rotationz')
      .min(-Math.PI).max(Math.PI).step(0.1)
      .onChange(function(value){
        updateModel(Mesh,'rotationz');
      }).listen();
    isMobile = detectedMobile();
    if(!isMobile){
      console.log('not mobile');
      lightFolder.open();
      gearFolder.open();
      modelFolder.open();
    }else{
      $('.button').addClass('mobile-button')
    }
  }

  initGuiControl();

  // Render whole scene
  function renderCanvas(){
    stats.begin();
    draw();
    stats.end();
    controls.update();
    for(var i in boxes){
      boxes[i].setFromObject(Mesh);
    }
    requestAnimationFrame(renderCanvas);
  }
  function draw(){
    for(var i in Meshes){
      if(Meshes[i].userData == 'gear'){
        var go = getGearAndOptFromMesh(Meshes[i]);
        go.gear.track();
        Meshes[i].rotation.z = - go.gear.phi;
      }
    }
    var go = getGearAndOptFromMesh(markedMesh);
    if(go != undefined){
      for(var i in go.gearOption){
        gearOption[i] = go.gearOption[i];
      }
      for(var i in gui.__controllers){
        gui.__controllers[i].updateDisplay();
      }
    }
    updateGearParameters();
    renderer.render(scene, camera);
  }

  renderCanvas()

  // Helper functions
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
  // Get Gear & Option infomation from mesh
  function getGearAndOptFromMesh(ms){
    if(ms != undefined && ms.userData == 'gear'){
      var uuid = ms.uuid;
      var _gear;
      var _option;
      for(var i in Gears){
        Gears[i].uuid == uuid ? _gear = Gears[i] : '';
      }
      for(var i in gearOptions){
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

  function removeItem(item,uuid){
    for(var i in item){
      if(item[i].uuid == uuid){
        item.splice(i,1)
      }
    }
  }

  function updateGearParameters(){
    var l = ['x','y','z'];
    if(Mesh!= undefined){
      for(var i in l){
        $('.position-' + l[i]).text(Mesh.position[l[i]].toFixed(2));
      }
    }
  }

  
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

  $('.add-model').on('click',function(){
    addModel();
  })

  $('.remove-model').on('click', function(){
    removeModel()
  })

  $('.remove-item').on('click', function(){
    removeModelItem()
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
    var intersects = raycaster.intersectObjects(Meshes);
    if(intersects.length > 0){
      Mesh = intersects[0].object;
      transControl.attach(Mesh);
      var box = new THREE.BoxHelper(Mesh, '#3d8ec6');
      boxes.push(box);
      scene.add(transControl);
      scene.add(box);
      isMobile ? controls.enabled = false : '';
      markedMesh = Mesh;
    }else{
      scene.remove(boxes[0]);
      boxes = [];
      scene.remove(transControl);
      transControl.detach(SELECT);
      isMobile ? controls.enabled = true : '';
    }
  }

  document.addEventListener( 'mousedown', onMouseDown, false );
  renderer.domElement.addEventListener( 'touchstart', onTouchStart, false );
})