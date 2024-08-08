import ND_Object from './ND_Object.js';


export default class ND_AxesHelper extends ND_Object{
    constructor(N, size=1){
        let vertices = math.concat(math.zeros(1, N), math.identity(N), 0);
        vertices = math.multiply(vertices, size);
        let vetores = Array.from({length: N}, (_, i) => [0, i+1]);
        let geometria = {
            N:N,
            K:N,
            vertices:vertices.toArray(),
            faces:[vetores]
        }
        super(geometria);
    }
}