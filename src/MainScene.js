// Sample 4D cube data.
const sampleCube4d = `4 1

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
 0 1 2 3 4 5 6 7`;


class MainScene {
    constructor() {
        // Three.js core components.
        this.scene = new THREE.Scene();
        this.backgroundColor = { color: "#FFFFFF" };
        this.scene.background = new THREE.Color(this.backgroundColor.color);

        // Create camera and renderer.
        this.camera = this.createCamera(); // 3D camera.
        this.renderer = this.createRenderer(); // Renderer.
        // Stores the initial FOV and initial scale factor.
        this.initialFov = this.camera.fov;
        this.previousScaleFactor = 1;
        this.pixelSize = { size: 1 };

        // Additional utilities.
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);
        this.gui = new dat.GUI();
        this.loadingNewFile = false;
        this.rendering = false;

        // Axes Helper.
        this.axesHelper = new THREE.AxesHelper(1);
        this.scene.add(this.axesHelper);

        // Scene contents.
        this.ndObject = undefined;
        this.ndCameras = undefined;
        this.cuts = undefined;
        this.slicer = undefined;

        // Keep track of GUI folders for removal.
        this.folderGeometry = undefined;
        this.folderCameras = undefined;
        this.folderCuts = undefined;

        // Rendering parameters.
        this.thicknessPowBasis = 2.;
        this.thicknessMinExp = -15.;
        this.thicknessMaxExp = -1.;
        this.geoShading = {radius: -5., shading: false};
        this.cutShading = {radius: -5., shading: false};

        // Set up event listeners and GUI.
        this.setupEventListeners();
        this.setupGUI();

        // Load sample geometry.
        this.changeViewedObject(sampleCube4d, true);
    }

    // Create a 3D perspective camera.
    createCamera() {
        // Camera params.
        const camera = new THREE.PerspectiveCamera(
            45, // Field of view.
            window.innerWidth / window.innerHeight,
            0.01, // Near plane.
            10000 // Far plane.
        );
        camera.position.set(0, 0, 10);
        return camera;
    }

    // Create the WebGL renderer.
    createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        // Adjust for device pixel ratio.
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    // Set up window, file, and drag-and-drop event listeners.
    setupEventListeners() {
        // Resize event.
        window.addEventListener('resize', () => this.onWindowResize());

        // File input event.
        document.getElementById('fileInput').addEventListener('change', (event) => this.handleFileSelect(event));

        // Drag-and-drop events.
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
            document.body.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        document.body.addEventListener('drop', (event) => {
            const file = event.dataTransfer.files[0];
            if (file) {
                this.handleFile(file);
            }
        });
    }

    // Set up dat.GUI panels.
    setupGUI() {
        // File operations folder.
        const fileFolder = this.gui.addFolder('File');
        fileFolder
            .add({ loadFile: () => document.getElementById('fileInput').click() }, 'loadFile')
            .name('Load Geometry');
        fileFolder
            .add({ takeScreenshot: () => this.takeScreenshot() }, 'takeScreenshot')
            .name('Take Screenshot');
        fileFolder.open();

        // Settings folder.
        const settingsFolder = this.gui.addFolder('Settings');
        settingsFolder
            .addColor(this.backgroundColor, 'color')
            .name('Background')
            .onChange(() => {
                this.scene.background = new THREE.Color(this.backgroundColor.color);
            });
        settingsFolder.add(this.axesHelper, 'visible').name('Show Axes');
        settingsFolder
            .add(this.pixelSize, 'size', 1, 5)
            .name('Pixel size')
            .onChange(() => this.onWindowResize());
        settingsFolder.open();

        // 3D Camera settings.
        const camera3DFolder = this.gui.addFolder('Camera 3D');
        camera3DFolder
            .add(this.camera, 'fov', 1, 85)
            .name('Field of View')
            .step(0.0001)
            .onChange(() => {
                this.updateCameraZoom(this.camera.fov);
                this.camera.updateProjectionMatrix();
            });
    }

    // Function to update the camera's zoom to maintain the apparent size of the object.
    // It actually keeps zoom at 1, but moves the camera position further away or closer.
    // Update the camera position to maintain the apparent size of the object.
    updateCameraZoom(newFov) {
        const newFovRad = THREE.MathUtils.degToRad(newFov);
        const initialFovRad = THREE.MathUtils.degToRad(this.initialFov);
        const cameraPos = math.matrix([this.camera.position.x, this.camera.position.y, this.camera.position.z]);
        const distanceToOrigin = math.norm(cameraPos);
        const normalizedPos = math.divide(cameraPos, distanceToOrigin);
        const newScaleFactor = Math.tan(initialFovRad / 2) / Math.tan(newFovRad / 2);
        const scaledPos = math.multiply(normalizedPos, (newScaleFactor / this.previousScaleFactor) * distanceToOrigin);
        this.previousScaleFactor = newScaleFactor;
        this.camera.position.set(scaledPos.get([0]), scaledPos.get([1]), scaledPos.get([2]));
    }

    // Capture a screenshot.
    takeScreenshot() {
        this.renderer.preserveDrawingBuffer = true;
        this.renderer.render(this.scene, this.camera);
        const image = this.renderer.domElement.toDataURL('image/png');
        // Creating a link to download the data.
        const link = document.createElement('a');
        link.download = 'screenshot.png';
        link.href = image;
        // "Clicking" on the created link.
        link.click();
        this.renderer.preserveDrawingBuffer = false;
    }

    // The main animation loop.
    animate() {
        if(!this.loadingNewFile) {
            this.rendering = true;
            this.renderer.render(this.scene, this.camera);
            if (this.ndCameras !== undefined) {
                if (this.cuts !== undefined) {
                    this.ndCameras.projectObjects([this.ndObject, this.cuts]);
                } else {
                    this.ndCameras.projectObjects([this.ndObject]);
                }
                this.ndCameras.lookAtOrigin();
            }

            this.stats.update();
            this.controls.update();
            this.rendering = false;
        }

        // NOTE: Window is implied.
        window.requestAnimationFrame(this.animate.bind(this));
    }

    // Adjust camera and renderer when the window size changes.
    onWindowResize() {
        const pixelRatio = window.devicePixelRatio || 1;

        // Update camera and renderer
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(pixelRatio / this.pixelSize.size);
    }

    // Handle file picker.
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    // Reading file.
    handleFile(file) {
        const validExtensions = ['.pol', '.ndp'];
        const fileName = file.name.toLowerCase();
        const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        if (!isValidExtension) {
            console.error('Invalid file format. Please, select a file under .pol or .ndp format.');
            alert('Invalid file format. Please select a .pol or .ndp file.');
            return;
        }

        if (fileName.endsWith('.ndp')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                this.changeViewedObject(content, true);
            };
            reader.readAsText(file);
        } else {
            this.changeViewedObject(file, false);
        }
    }

    // Change the rendered object.
    async changeViewedObject(content, isNDP) {
        const progressElem = document.getElementById("progress");
        progressElem.textContent = `Progress: 0.00%`;
        progressElem.style.display = 'flex';

        this.renderer.preserveDrawingBuffer = true;
        this.loadingNewFile = true;
        while(this.rendering);

        // Remove previous scene objects and GUI folders.
        this.removeOldContent();

        let geometryData;
        if (isNDP) {
            try {
                geometryData = await readNDP(content);
            } catch (error) {
                console.error("Error reading NDP file:", error);
            }
        } else {
            try {
                geometryData = await readPOL(content);
            } catch (error) {
                console.error("Error reading POL file:", error);
            }
        }

        // Create new ND object and cameras.
        this.ndObject = new ND_Object(geometryData);
        this.ndObject.updateUniforms(Math.pow(this.thicknessPowBasis, this.geoShading.radius), this.geoShading.shading ? 1 : 0);
        const hasNDCameras = this.ndObject.dimN > 3;
        this.ndCameras = new ND_Cameras(this.ndObject.dimN);
        const hasCuts = (this.ndObject.dimN - this.ndObject.dimK) > 1;
        if (hasCuts) {
            this.slicer = new ND_Corte(this.ndObject);
            this.cuts = this.slicer.getCut();
            this.cuts.updateUniforms(Math.pow(this.thicknessPowBasis, this.cutShading.radius), this.cutShading.shading ? 1 : 0);
        } else {
            this.slicer = this.cuts = undefined;
        }

        // Update the scene.
        this.scene.add(this.ndObject.Mesh);
        if (hasCuts) {
            this.scene.add(this.cuts.Mesh);
            this.ndCameras.projectObjects([this.ndObject, this.cuts]);
        } else {
            this.ndCameras.projectObjects([this.ndObject]);
        }
        this.ndCameras.centralizeFirstCamera(this.ndObject.center);
        this.ndCameras.lookAtOrigin();

        // Rebuild GUI sections.
        this.buildGeometryGUI();
        if (hasCuts) this.buildCutGUI();
        if (hasNDCameras) this.buildCamerasGUI();



        this.loadingNewFile = false;
        this.renderer.preserveDrawingBuffer = false;
        progressElem.style.display = 'none';
    }

    // Helper: Remove previous scene objects and GUI folders.
    removeOldContent() {
        if (this.folderCameras) {
            this.gui.removeFolder(this.folderCameras);
            this.folderCameras = undefined;
        }
        if (this.folderGeometry) {
            this.gui.removeFolder(this.folderGeometry);
            this.folderGeometry = undefined;
        }
        if (this.folderCuts) {
            this.gui.removeFolder(this.folderCuts);
            this.folderCuts = undefined;
        }
        if (this.ndObject) {
            this.scene.remove(this.ndObject.Mesh);
            this.ndObject = undefined;
        }
        if (this.cuts) {
            this.scene.remove(this.cuts.Mesh);
            this.cuts = undefined;
        }
    }

    // Helper: Build the geometry GUI.
    buildGeometryGUI() {
        this.folderGeometry = this.gui.addFolder('Geometry');
        this.folderGeometry
            .add(this.ndObject.Mesh, 'visible')
            .name('Visible')
            .onChange(() => (this.ndObject.needsUpdate = true));
        this.folderGeometry.add(this.geoShading, 'shading').name('3D Shading').onChange(() => {
            this.ndObject.updateUniforms(Math.pow(this.thicknessPowBasis, this.geoShading.radius), this.geoShading.shading ? 1 : 0);
        });
        this.folderGeometry.add(this.geoShading, 'radius', this.thicknessMinExp, this.thicknessMaxExp)
            .name('Thickness')
            .step(0.001)
            .onChange(() => {
                this.ndObject.updateUniforms(Math.pow(this.thicknessPowBasis, this.geoShading.radius), this.geoShading.shading ? 1 : 0);
            });
        const colorMapFolder = this.folderGeometry.addFolder('Color Map');
        this.ndObject.gera_GUI(colorMapFolder);
        colorMapFolder.close();
        this.folderGeometry.close();
    }

    // Helper: Build the cuts GUI.
    buildCutGUI() {
        this.folderCuts = this.gui.addFolder('Dimensional Cuts');
        this.folderCuts
            .add(this.cuts, 'visible')
            .name('Visible')
            .onChange(() => {
                if(this.cuts.visible){
                    // Sectional cut starts with the entire object. Now we update to the actual cut.
                    this.slicer.corte();
                }
                this.cuts.Mesh.children[0].visible = this.cuts.visible;
                this.cuts.Mesh.children[1].visible = this.cuts.visible;
                this.cuts.needsUpdate = true;
            });

        this.folderCuts
            .add(this.cuts, 'highlighted')
            .name('Highlight Cut')
            .onChange(() => this.cuts.highlightObject());

        const sliderCutPosition = this.folderCuts
            .add(
                this.slicer,
                'localDoCorte',
                this.slicer.coordsMinMax[this.slicer.coordCorte].min + 1e-3,
                this.slicer.coordsMinMax[this.slicer.coordCorte].max - 1e-3
            )
            .name('Cut position')
            .step(0.0001)
            .onChange(() => this.slicer.corte());

        this.folderCuts
            .add(this.slicer, 'coordCorte', 0, this.slicer.dimN - 1)
            .name('Cut Coord')
            .step(1)
            .onChange(() => {
                this.slicer.localDoCorte =
                    (this.slicer.coordsMinMax[this.slicer.coordCorte].min +
                        this.slicer.coordsMinMax[this.slicer.coordCorte].max) / 2;
                sliderCutPosition.min(this.slicer.coordsMinMax[this.slicer.coordCorte].min + 1e-3);
                sliderCutPosition.max(this.slicer.coordsMinMax[this.slicer.coordCorte].max - 1e-3);
                sliderCutPosition.updateDisplay();
                this.slicer.corte();
            });

        this.folderCuts.add(this.cutShading, 'shading').name('3D Shading').onChange(() => {
            if(this.cuts) {
                this.cuts.updateUniforms(Math.pow(this.thicknessPowBasis, this.cutShading.radius), this.cutShading.shading ? 1 : 0);
            }
        });
        this.folderCuts.add(this.cutShading, 'radius', this.thicknessMinExp, this.thicknessMaxExp)
            .name('Thickness')
            .step(0.001)
            .onChange(() => {
                if(this.cuts) {
                    this.cuts.updateUniforms(Math.pow(this.thicknessPowBasis, this.cutShading.radius), this.cutShading.shading ? 1 : 0);
                }
            });

        const cutColorMapFolder = this.folderCuts.addFolder('Cut Color Map');
        this.cuts.gera_GUI(cutColorMapFolder);
        cutColorMapFolder.close();
        this.folderCuts.close();
    }

    // Helper: Build the N-dimensional cameras GUI.
    buildCamerasGUI() {
        this.folderCameras = this.gui.addFolder('Cameras ND');
        this.ndCameras.cameras.forEach((camera) => {
            const camFolder = this.folderCameras.addFolder(`Camera ${camera.dimN}D`);
            // Field of view slider.
            camera.sliderFovController = camFolder
                .add(camera, 'fov', 1, 85)
                .name('Field of View')
                .step(0.0001)
                .listen()
                .onChange(() => camera.updateFov());
            // Perspective toggle.
            camFolder
                .add(camera, 'perspective')
                .name('Perspective')
                .listen()
                .onChange(() => {
                    camera.lookAt(math.zeros(camera.dimN), undefined, true);
                    const isPerspective = camera.perspective;
                    camera.sliderFovController.domElement.style.pointerEvents = isPerspective ? 'auto' : 'none';
                    camera.sliderFovController.domElement.style.opacity = isPerspective ? 1.0 : 0.5;
                });
            {
                const isPerspective = camera.perspective;
                camera.sliderFovController.domElement.style.pointerEvents = isPerspective ? 'auto' : 'none';
                camera.sliderFovController.domElement.style.opacity = isPerspective ? 1.0 : 0.5;
            }
            // Spherical coordinate controllers.
            camera.spherical.forEach((value, index) => {
                const angleMin = -Math.PI / 2 + 1e-2;
                const angleMax = Math.PI / 2 - 1e-2;
                camFolder
                    .add(camera.spherical, index, angleMin, angleMax)
                    .name(`Phi${index + 1}`)
                    .step(0.0001)
                    .onChange(() => camera.UpdatePos());
            });
        });
        this.folderCameras.close();
    }
}
