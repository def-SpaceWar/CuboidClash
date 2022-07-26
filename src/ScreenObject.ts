import { GLItems } from "./glSetup";

export type TextureDimensions = {
    w: number,
    h: number
}

// Make tint field soon! Using fragment shader add a tint option that tints all the pixels by multiplying them all into a specific color!
export class ScreenObject {
    public texture: WebGLTexture;
    public textureDimensions: TextureDimensions;

    constructor(public glItems: GLItems, public x: number, public y: number, public w: number, public h: number, image: HTMLImageElement, public color: number[] = [1, 1, 1, 1]) {
        this.texture = glItems.gl.createTexture()!;
        glItems.gl.bindTexture(glItems.gl.TEXTURE_2D, this.texture);

        // Fill the texture with a 1x1 ~~blue~~ Purplish pixel.
        glItems.gl.texImage2D(glItems.gl.TEXTURE_2D, 0, glItems.gl.RGBA, 1, 1, 0, glItems.gl.RGBA, glItems.gl.UNSIGNED_BYTE,
            new Uint8Array([255, 0, 255, 255]));
        this.textureDimensions = { w: 2, h: 2 };

        glItems.gl.texParameteri(glItems.gl.TEXTURE_2D, glItems.gl.TEXTURE_WRAP_S, glItems.gl.CLAMP_TO_EDGE);
        glItems.gl.texParameteri(glItems.gl.TEXTURE_2D, glItems.gl.TEXTURE_WRAP_T, glItems.gl.CLAMP_TO_EDGE);

        try {
            glItems.gl.bindTexture(glItems.gl.TEXTURE_2D, this.texture);
            glItems.gl.texImage2D(glItems.gl.TEXTURE_2D, 0, glItems.gl.RGBA, glItems.gl.RGBA, glItems.gl.UNSIGNED_BYTE, image);
            glItems.gl.generateMipmap(glItems.gl.TEXTURE_2D);

            this.textureDimensions.w = image.width;
            this.textureDimensions.h = image.height;
        } catch {
            image.addEventListener('load', () => {
                glItems.gl.bindTexture(glItems.gl.TEXTURE_2D, this.texture);
                glItems.gl.texImage2D(glItems.gl.TEXTURE_2D, 0, glItems.gl.RGBA, glItems.gl.RGBA, glItems.gl.UNSIGNED_BYTE, image);
                glItems.gl.generateMipmap(glItems.gl.TEXTURE_2D);

                this.textureDimensions.w = image.width;
                this.textureDimensions.h = image.height;
            });
        }
    }


    get x1() {
        return this.x - this.w / 2;
    }

    get y1() {
        return this.y - this.h / 2;
    }

    get x2() {
        return this.x + this.w / 2;
    }

    get y2() {
        return this.y + this.h / 2;
    }

    draw() {
        this.glItems.gl.useProgram(this.glItems.program);

        // Setup the attributes for the quad
        this.glItems.gl.bindVertexArray(this.glItems.vao);

        const textureUnit = 0;
        // The the shader we're putting the texture on texture unit 0
        this.glItems.gl.uniform1i(this.glItems.textureLocation, textureUnit);

        // Bind the texture to texture unit 0
        this.glItems.gl.activeTexture(this.glItems.gl.TEXTURE0 + textureUnit);
        this.glItems.gl.bindTexture(this.glItems.gl.TEXTURE_2D, this.texture);

        this.glItems.gl.texParameteri(this.glItems.gl.TEXTURE_2D, this.glItems.gl.TEXTURE_WRAP_S, this.glItems.gl.CLAMP_TO_EDGE);
        this.glItems.gl.texParameteri(this.glItems.gl.TEXTURE_2D, this.glItems.gl.TEXTURE_WRAP_T, this.glItems.gl.CLAMP_TO_EDGE);
        this.glItems.gl.texParameteri(this.glItems.gl.TEXTURE_2D, this.glItems.gl.TEXTURE_MIN_FILTER, this.glItems.gl.NEAREST);
        this.glItems.gl.texParameteri(this.glItems.gl.TEXTURE_2D, this.glItems.gl.TEXTURE_MAG_FILTER, this.glItems.gl.NEAREST);

        // this matrix will convert from pixels to clip space
        let matrix = orthographic(
            0, this.glItems.gl.canvas.width, this.glItems.gl.canvas.height, 0, -1, 1);

        // translate our quad to dstX, dstY
        matrix = translate(matrix, this.x, this.y, 0);

        // scale our 1 unit quad
        // from 1 unit to dstWidth, dstHeight units
        matrix = scale(matrix, this.w, this.h, 1);

        // Set the matrix.
        this.glItems.gl.uniformMatrix4fv(this.glItems.matrixLocation, false, matrix);

        this.glItems.gl.uniform4f(this.glItems.colorLocation, this.color[0], this.color[1], this.color[2], this.color[3]);

        // draw the quad (2 triangles, 6 vertices)
        const offset = 0;
        const count = 6;
        this.glItems.gl.drawArrays(this.glItems.gl.TRIANGLES, offset, count);
    }
}

function orthographic(left: number, right: number, bottom: number, top: number, near: number, far: number, dst?: Float32Array) {
    dst = dst || new Float32Array(16);

    dst[0] = 2 / (right - left);
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 2 / (top - bottom);
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 2 / (near - far);
    dst[11] = 0;
    dst[12] = (left + right) / (left - right);
    dst[13] = (bottom + top) / (bottom - top);
    dst[14] = (near + far) / (near - far);
    dst[15] = 1;

    return dst;
}

function translate(m: Float32Array, tx: number, ty: number, tz: number, dst?: Float32Array) {
    // This is the optimized version of
    // return multiply(m, translation(tx, ty, tz), dst);
    dst = dst || new Float32Array(16);

    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m03 = m[3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];

    if (m !== dst) {
        dst[0] = m00;
        dst[1] = m01;
        dst[2] = m02;
        dst[3] = m03;
        dst[4] = m10;
        dst[5] = m11;
        dst[6] = m12;
        dst[7] = m13;
        dst[8] = m20;
        dst[9] = m21;
        dst[10] = m22;
        dst[11] = m23;
    }

    dst[12] = m00 * tx + m10 * ty + m20 * tz + m30;
    dst[13] = m01 * tx + m11 * ty + m21 * tz + m31;
    dst[14] = m02 * tx + m12 * ty + m22 * tz + m32;
    dst[15] = m03 * tx + m13 * ty + m23 * tz + m33;

    return dst;
}

function scale(m: Float32Array, sx: number, sy: number, sz: number, dst?: Float32Array) {
    // This is the optimized version of
    // return multiply(m, scaling(sx, sy, sz), dst);
    dst = dst || new Float32Array(16);

    dst[0] = sx * m[0 * 4 + 0];
    dst[1] = sx * m[0 * 4 + 1];
    dst[2] = sx * m[0 * 4 + 2];
    dst[3] = sx * m[0 * 4 + 3];
    dst[4] = sy * m[1 * 4 + 0];
    dst[5] = sy * m[1 * 4 + 1];
    dst[6] = sy * m[1 * 4 + 2];
    dst[7] = sy * m[1 * 4 + 3];
    dst[8] = sz * m[2 * 4 + 0];
    dst[9] = sz * m[2 * 4 + 1];
    dst[10] = sz * m[2 * 4 + 2];
    dst[11] = sz * m[2 * 4 + 3];

    if (m !== dst) {
        dst[12] = m[12];
        dst[13] = m[13];
        dst[14] = m[14];
        dst[15] = m[15];
    }

    return dst;
}
