import * as THREE from "three";

import { GUI } from "jsm/libs/lil-gui.module.min.js";

import MainCena from './src/MainCena.js';
import ND_Object from './src/ND_Object.js';
import ND_Cameras from './src/ND_Cameras.js';

//import * as mathjs from "mathjs";

const test = new MainCena();

test.initialize();
test.animate();




/*const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshNormalMaterial();
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);*/

//test.scene.add(boxMesh);


//const cam4D = new ND_Camera(4, [0, 0, 0, -2]);

//cam4D.lookAt(math.zeros(4));

//const camsND = new ND_Cameras(4);

//const ndObj = new ND_Object(kleinBottleOtimizado);


//test.scene.add(ndObj.Mesh);

//Cria pasta e insere Cameras na gui
//const camerasFolder = test.gui.addFolder('Cameras');
//camerasFolder.close();

/*camsND.cameras.forEach((camera, i) => {
  const cameraIDFolder = camerasFolder.addFolder(`Camera ${camera.dimN}D`);
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
/*const camera4DFolder = camerasFolder.addFolder('Camera4D');
camsND.cameras[0].esfericas.forEach((value, index) => {
      let inter1 = -math.pi*0.5;
      let inter2 = math.pi*0.5;
      if (index == camsND.cameras[0].dimN-2){
        inter1 = 0;
        inter2 = math.pi*2;
      }
      camera4DFolder.add(camsND.cameras[0].esfericas, index, inter1, inter2).name(`Phi${index+1}`).onChange((newValue) => {
      camsND.cameras[0].UpdatePos();
      });
});*/
/*camera4DFolder.add(camsND.cameras[0].esfericas[0], '[0]', 0, 2*Math.PI).name('Rotate theta_1 Axis');
camera4DFolder.add(camsND.cameras[0].esfericas[0], 'theta_2', 0, 2*Math.PI).name('Rotate theta_2 Axis');
camera4DFolder.add(camsND.cameras[0].esfericas[0], 'theta_3', 0, 2*Math.PI).name('Rotate theta_3 Axis');
*/
/*const scaleFolder = geometryFolder.addFolder('Scale');
scaleFolder.add(boxMesh.scale, 'x', 0, 2).name('Scale X Axis');
scaleFolder.add(boxMesh.scale, 'y', 0, 2).name('Scale X Axis');
scaleFolder.add(boxMesh.scale, 'z', 0, 2).name('Scale X Axis');
*/

//camsND.projetaObjetos(ndObj);

function animate(t = 0){
    requestAnimationFrame(animate);
    //ndObj.Mesh.rotation.y = t * 0.0005;
    //camsND.cameras[0].RotVecPos(0, 3, math.pi*5);
    //camsND.cameras[0].RotVecPos(0, 3, 0.005);
    //camsND.cameras[0].lookAt([0, 0, 0, 0])
    //camsND.cameras[0].lookAt([0, 0, 0, 0]);
    //camsND.projetaObjetos(ndObj);

    //camsND.lookAtOrigem();
    //ndObj.updateVertices();
    //cam4D.position[3] += t*0.0001;
    //cam4D.lookAt([0, 0, 0, 0]);
    //renderer.render(scene, camera);
}


animate();