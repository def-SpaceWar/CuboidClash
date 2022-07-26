import vertexShaderSource from './glsl/vertex.glsl?raw';
import fragmentShaderSource from './glsl/fragment.glsl?raw';

export type GLItems = {
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    vao: WebGLVertexArrayObject,
    positionAttributeLocation: number,
    texcoordAttributeLocation: number,
    colorLocation: WebGLUniformLocation,
    matrixLocation: WebGLUniformLocation,
    textureLocation: WebGLUniformLocation
}

export function setupGl(): GLItems {
    const canvas: HTMLCanvasElement = document.querySelector('#game')!;
    canvas.width = 1280;
    canvas.height = 720;

    let gl: WebGL2RenderingContext;

    if (!canvas.getContext("webgl2")) throw new Error("WebGL2 is not supported!");

    gl = canvas.getContext("webgl2")!;
    console.debug("WebGL2 successfully loaded!")

    function createShader(type: number, source: string): WebGLShader {
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!success) {
            console.log(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
        }

        return shader;
    }

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }

    gl.useProgram(program);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const texcoordAttributeLocation = gl.getAttribLocation(program, "a_texcoord");
    const colorLocation = gl.getUniformLocation(program, "u_color")!;
    const matrixLocation = gl.getUniformLocation(program, "u_matrix")!;
    const textureLocation = gl.getUniformLocation(program, "u_texture")!;

    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Draw objects from their centers!
    const positions = [
        0 - 0.5, 0 - 0.5,
        0 - 0.5, 1 - 0.5,
        1 - 0.5, 0 - 0.5,
        1 - 0.5, 0 - 0.5,
        0 - 0.5, 1 - 0.5,
        1 - 0.5, 1 - 0.5,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);

    let size = 2;          // 2 components per iteration
    let type = gl.FLOAT;   // the data is 32bit floats
    let normalize = false; // don't normalize the data
    let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    let offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);

    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

    // draw textures from top left to bottom (IDK if I might need to make this match `positions`)
    const texcoords = [
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texcoordAttributeLocation);

    size = 2;          // 3 components per iteration
    type = gl.FLOAT;   // the data is 32bit floats
    normalize = true;  // convert from 0-255 to 0.0-1.0
    stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next color
    offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        texcoordAttributeLocation, size, type, normalize, stride, offset);

    return {
        gl,
        program,
        vao,
        positionAttributeLocation,
        texcoordAttributeLocation,
        colorLocation,
        matrixLocation,
        textureLocation
    };
}
