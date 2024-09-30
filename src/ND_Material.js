


class ND_Material{
    constructor(vertexShader, fragmentShader){

        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
        });
    }
}


class Colored_Coords extends ND_Material{
    constructor(NDObj, cor1={ cor:'#00ff00' }, cor2={ cor:'#ff00ff' }){
        const vertexShader = `
        varying vec4 pos;

        attribute vec4 colorPosition;
        varying vec4 cor;

        void main() {
            cor = colorPosition;

            pos = vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewMatrix * pos;
        }
        `;
        const fragmentShader = `
        varying vec4 pos;
        varying vec4 cor;

        void main() {
            //gl_FragColor = vec4(pos.xyz * 3.0, 1);//cor.y, 1);//vec4(cor, cor, 0, 1);
            gl_FragColor = vec4(cor.xyz, 1);//cor.y, 1);//vec4(cor, cor, 0, 1);
        }
        `;
        super(vertexShader, fragmentShader);

        this.NDObj = NDObj;

        this.dimN = NDObj.dimN;

        this.cor1 = cor1;//{ cor:'#00ff00' };//new THREE.Color( 0x00ff00 );
        this.cor2 = cor2//{ cor:'#ff00ff' };//new THREE.Color( 0xff00ff );

        this.coordColorida = 0;
    }

    updateColors(){
        let cor1 = new THREE.Color( this.cor1.cor );
        let cor2 = new THREE.Color( this.cor2.cor );
        const colorVerts = this.NDObj.geometria.vertices
            .map((vertice) => [mapNumRange(vertice[this.coordColorida], this.NDObj.coordsMinMax[this.coordColorida].min, this.NDObj.coordsMinMax[this.coordColorida].max, cor1.r, cor2.r), 
                               mapNumRange(vertice[this.coordColorida], this.NDObj.coordsMinMax[this.coordColorida].min, this.NDObj.coordsMinMax[this.coordColorida].max, cor1.g, cor2.g), 
                               mapNumRange(vertice[this.coordColorida], this.NDObj.coordsMinMax[this.coordColorida].min, this.NDObj.coordsMinMax[this.coordColorida].max, cor1.b, cor2.b)])
            .flat();
        let buffer_color_vertices =  new Float32Array(colorVerts);
        this.NDObj.geometry3D.setAttribute('colorPosition', new THREE.BufferAttribute(buffer_color_vertices, 3));
    }

    gera_GUI(pasta){//N tenho certeza se isso devira estar em ND_Object
        pasta.addColor(this.cor1, 'cor' )
            .name('Color 1')
            .onChange(() => this.updateColors());
        pasta.addColor(this.cor2, 'cor' )
            .name('Color 2')
            .onChange(() => this.updateColors());
        pasta.add(this, 'coordColorida', 0, this.dimN-1)
            .name('Colored coordenate')
            .step(1)
            .onChange(() => this.updateColors());
    }
}






function mapNumRange(num, inMin, inMax, outMin, outMax){
    return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}