import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import Stats from 'jsm/libs/stats.module.js';
import { GUI } from "jsm/libs/lil-gui.module.min.js";

import { readNDP, readPOL } from "./lib/FileReader.js";

import ND_Object from './ND_Object.js';
import ND_Cameras from './ND_Cameras.js';

import ND_AxesHelper from "./ND_AxisHelper.js";
//import { lerArquivo } from './lib/FileImporter.js';

const conteudohcubo = `4 4

16
-0.5 -0.5 -0.5 -0.5
-0.5 -0.5 -0.5  0.5
-0.5 -0.5  0.5 -0.5
-0.5 -0.5  0.5  0.5
-0.5  0.5 -0.5 -0.5
-0.5  0.5 -0.5  0.5
-0.5  0.5  0.5 -0.5
-0.5  0.5  0.5  0.5
 0.5 -0.5 -0.5 -0.5
 0.5 -0.5 -0.5  0.5
 0.5 -0.5  0.5 -0.5
 0.5 -0.5  0.5  0.5
 0.5  0.5 -0.5 -0.5
 0.5  0.5 -0.5  0.5
 0.5  0.5  0.5 -0.5
 0.5  0.5  0.5  0.5

32
 0  1 
 1  3 
 2  3 
 0  2
 4  5 
 5  7 
 6  7 
 4  6 
 0  4 
 1  5 
 2  6 
 3  7
 8  9
 9 11 
10 11
 8 10
12 13 
13 15 
14 15 
12 14 
 8 12 
 9 13 
10 14
11 15
 0  8 
 1  9 
 2 10 
 3 11
 4 12 
 5 13 
 6 14 
 7 15

24
     0     1     2     3
     4     5     6     7
     0     4     8     9
     2     6    10    11
     3     7     8    10 
     1     5     9    11 
    12    13    14    15
    16    17    18    19
    12    16    20    21
    14    18    22    23
    15    19    20    22
    13    17    21    23
     0    12    24    25 
     2    14    26    27
     3    15    24    26
     1    13    25    27
     4    16    28    29
     6    18    30    31
     7    19    28    30
     5    17    29    31
     8    20    24    28
     9    21    25    29
    10    22    26    30
    11    23    27    31 

8
 0  1  2  3  4  5
 6  7  8  9 10 11
 0  6 12 13 14 15
 1  7 16 17 18 19
 2  8 12 16 20 21
 3  9 13 17 22 23
 4 10 14 18 20 22
 5 11 15 19 21 23

1
 0 1 2 3 4 5 6 7`


export default class MainCena {
  constructor() {
    // NOTE: Core components to initialize Three.js app.
    this.scene = undefined;
    this.camera = undefined;
    this.renderer = undefined;

    // NOTE: Camera params;
    this.fov = 45;
    this.nearPlane = 1;
    this.farPlane = 1000;
    //this.canvasId = canvasId;

    // NOTE: Additional components.
    this.clock = undefined;
    this.stats = undefined;
    this.controls = undefined;
    this.gui = undefined;

    //Helper
    this.axesHelperND = undefined;
    
    //Conteudo da cena
    this.arquivo = undefined;

    this.NDObj = undefined;
    this.NDCams = undefined;    

    // NOTE: Lighting is basically required.
    this.ambientLight = undefined;
    this.directionalLight = undefined;

    this.backgroundColor = undefined;

  }

  func(content) {
    console.log(content);
  }

  initialize() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x123456);

    //Camera 3D
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      window.innerWidth / window.innerHeight,
      0.01,
      10_000
    );
    this.camera.position.z = 4;

    //Renderer
    // NOTE: Specify a canvas which is already created in the HTML.
    //const canvas = document.getElementById(this.canvasId);
    this.renderer = new THREE.WebGLRenderer({
      //canvas,
      antialias: true,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    //Tools
    this.clock = new THREE.Clock();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.stats = Stats();
    document.body.appendChild(this.stats.dom);

    //Axes Helper
    this.axesHelper = new THREE.AxesHelper(1);
    this.scene.add(this.axesHelper);

    //Botão para importar arquivos (fica escondido)
    document.getElementById('fileInput').addEventListener('change', (event) => this.fileSelect(event));
  

    //GUI
    this.gui = new GUI();

    //this.scene.background = new THREE.Color(0x654321);
    this.pastaControles = this.gui.addFolder('Helpers');
    this.pastaControles.addColor(this.scene, 'background').name('Background Color');
    this.pastaControles.add(this.axesHelper, 'visible').name('Axis Helper');

    //const gridHelper = new THREE.GridHelper( 10, 100 );
    //this.scene.add( gridHelper );
    //this.gui.add();
    //axesHelper.showX = false;

    this.ChangeViewedObj(conteudohcubo, true)

    /*//Geometria inicial
    this.NDObj = new ND_Object(conteudohcubo, true);//kleinBottleOtimizado);
    this.NDCams = new ND_Cameras(4);

    //Primeira projeção
    this.scene.add(this.NDObj.Mesh);
    this.NDCams.projetaObjetos(this.NDObj);
    this.NDCams.lookAtOrigem();

    //GUI da geometria
    this.pastaCameras = this.gui.addFolder('Cameras');
    this.pastaCameras.close();

    this.NDCams.cameras.forEach((camera, i) => {
      const cameraIDFolder = this.pastaCameras.addFolder(`Camera ${camera.dimN}D`);
      cameraIDFolder.add(camera, "perspective").name(`Perspectiva`).onChange(() => {camera.lookAt(math.zeros(camera.dimN), undefined, true)});;
      camera.esfericas.forEach((value, index) => {
        let inter1 = -math.pi*0.5;
        let inter2 = math.pi*0.5;
        if (index == camera.dimN-2){
          inter1 = 0;
          inter2 = math.pi*2;
        }
        cameraIDFolder.add(camera.esfericas, index, inter1, inter2).name(`Phi${index+1}`).onChange(() => {camera.UpdatePos();});
      });
    });*/

    //iluminação pode sair?
    /*// ambient light which is for the whole scene
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.ambientLight.castShadow = true;
    this.scene.add(this.ambientLight);

    // directional light - parallel sun rays
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    // this.directionalLight.castShadow = true;
    this.directionalLight.position.set(0, 32, 64);
    this.scene.add(this.directionalLight);*/

    // if window resizes
    window.addEventListener('resize', () => this.onWindowResize(), false);

    // NOTE: Load space background.
    // this.loader = new THREE.TextureLoader();
    // this.scene.background = this.loader.load('./pics/space.jpeg');

    // NOTE: Declare uniforms to pass into glsl shaders.
    // this.uniforms = {
    //   u_time: { type: 'f', value: 1.0 },
    //   colorB: { type: 'vec3', value: new THREE.Color(0xfff000) },
    //   colorA: { type: 'vec3', value: new THREE.Color(0xffffff) },
    // };
  }

  animate() {
    // NOTE: Window is implied.
    // requestAnimationFrame(this.animate.bind(this));
    window.requestAnimationFrame(this.animate.bind(this));
    this.render();
    this.stats.update();
    this.controls.update();

    this.NDCams.projetaObjetos(this.NDObj);
    //this.NDCams.projetaObjetos(this.axesHelperND);
    this.NDCams.lookAtOrigem();
  }

  render() {
    // NOTE: Update uniform data on each render.
    // this.uniforms.u_time.value += this.clock.getDelta();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  fileSelect(event) {
    const file = event.target.files[0];
    if (file) {

        const extensoesValidas = ['.pol', '.ndp'];
        const nomeArquivo = file.name.toLowerCase();
        const ehExtensaoValida = extensoesValidas.some(extension => nomeArquivo.endsWith(extension));
        
        if (!ehExtensaoValida) {
            console.error('Formato de arquivo inválido. Por favor, selecione um arquivo .pol ou .ndp.');
            alert('Formato de arquivo inválido. Por favor, selecione um arquivo .pol ou .ndp.');
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
            let content = e.target.result;
            this.ChangeViewedObj(content, nomeArquivo.endsWith('.ndp'));
        };
        
        reader.readAsText(file);
    }
  }

  //Muda o objeto renderizado
  ChangeViewedObj(conteudo, ehNDP) {
    //Remove GUI das cameras anterior
    if (this.pastaCameras != undefined){
      this.pastaCameras.destroy();
    };

    //Remove GUI da geometria anterior
    if (this.pastaGeometria != undefined){
      this.pastaGeometria.destroy();
    };

    //Remove Malha do Objeto anterior
    if (this.NDObj != undefined){
      this.scene.remove(this.NDObj.Mesh);
    };
    
    let geometria;
    if (ehNDP){
      geometria = readNDP(conteudo);
    } else {
      geometria = readPOL(conteudo);
    }

    //Geometria inicial
    this.NDObj = new ND_Object(geometria);
    this.NDCams = new ND_Cameras(this.NDObj.dimN);

    //Primeira projeção
    this.scene.add(this.NDObj.Mesh);
    this.NDCams.projetaObjetos(this.NDObj);
    this.NDCams.lookAtOrigem();

    //AxesHelper
    //this.axesHelperND = new ND_AxesHelper(this.NDObj.dimN);
    //this.scene.add(this.axesHelperND.Mesh);
    //this.NDCams.projetaObjetos(this.NDObj);

    //GUI da geometria
    this.pastaGeometria = this.gui.addFolder('Geometry');

    //GUI Seletor de arquivos
    var params = {
      loadFile : function() { 
        document.getElementById('fileInput').click();
      }
    };
    this.pastaGeometria.add(params, 'loadFile').name('Load Geometry');

    //GUI do mapa de cores
    this.pastaMapa_Cores = this.pastaGeometria.addFolder('Color Map');
    this.pastaMapa_Cores.addColor(this.NDObj, 'cor1').name('Color 1').onChange(() => this.NDObj.updateColors());
    this.pastaMapa_Cores.addColor(this.NDObj, 'cor2').name('Color 2').onChange(() => this.NDObj.updateColors());
    this.pastaMapa_Cores.add(this.NDObj, 'coordColorida', 0, this.NDObj.dimN-1).step(1).name('Colored coordenate').onChange(() => this.NDObj.updateColors());
    this.pastaGeometria.close();

    //GUI das cameras
    this.pastaCameras = this.gui.addFolder('Cameras');
    this.pastaCameras.close();

    this.NDCams.cameras.forEach((camera, i) => {
      const cameraIDFolder = this.pastaCameras.addFolder(`Camera ${camera.dimN}D`);

      //Seleciona FoV
      cameraIDFolder.add(camera, "FoV", 0, 180).name("Field of View").onChange(() => {
        camera.perspective = (camera.FoV != 0);
        camera.updateProjectionMatrix();
        camera.lookAt(math.zeros(camera.dimN), undefined, true);
      });

      //Toggle perspectiva
      cameraIDFolder.add(camera, "perspective")
      .name(`Perspective`)
      .listen()
      .onChange(() => {camera.lookAt(math.zeros(camera.dimN), undefined, true)});
      
      //Seleciona coordenadas hyperpolares
      camera.esfericas.forEach((value, index) => {
        let inter1 = -math.pi*0.5;
        let inter2 = math.pi*0.5;
        if (index == camera.dimN-2){
          inter1 = 0;
          inter2 = math.pi*2;
        }
        cameraIDFolder.add(camera.esfericas, index, inter1, inter2).name(`Phi${index+1}`).onChange(() => {camera.UpdatePos();});
      });
    });
  }

  //nao faz sentido isso ficar aqui...

};

