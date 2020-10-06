const scene = {
    "camera": {
        "position": [0, 0, 0],
        "fov": Math.PI / 2,
        "backgroundColor": [0.2, 0.3, 0.4]
    },
    "objects": [
        {
            "type": "sphere",
            "position": [-4.5, 0, -8],
            "radius": 2,
            "material": 0
        },
        {
            "type": "sphere",
            "position": [-2, 2.5, -5],
            "radius": 1.0,
            "material": 2
        },
        {
            "type": "sphere",
            "position": [0.5, -0.5, -9],
            "radius": 3,
            "material": 1
        },
        {
            "type": "sphere",
            "position": [8, 5, -12],
            "radius": 4,
            "material": 2
        }
    ],
    "materials": [
        {
            "diffuseColor": [0.4, 0.4, 0.3],
            "albedo": [0.6, 0.3, 0.3],
            "specularExponent": 50
        },
        {
            "diffuseColor": [0.3, 0.1, 0.1],
            "albedo": [0.9, 0.1, 0],
            "specularExponent": 10
        },
        {
            "diffuseColor": [1.0, 1.0, 1.0],
            "albedo": [0.0, 10.0, 0.8],
            "specularExponent": 1425
        }
    ],
    "lights": [
        {
            "position": [-20, 20, 20],
            "intensity": 1.5
        },
        {
            "position": [30, 50, -25],
            "intensity": 1.8
        },
        {
            "position": [30, 20, 30],
            "intensity": 1.7
        }
    ]
};

const MAX_DEPTH = 4;
const EPSILON = 0.001;

const length = (v) => {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

const normalize = (v) => {
    let len = length(v);
    return [v[0] / len, v[1] / len, v[2] / len];
}

const dot = (a, b) => {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

const add = (a, b) => {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

const subtract = (a, b) => {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

const multiply = (vec, s) => {
    return [vec[0] * s, vec[1] * s, vec[2] * s];
}

const reflect = (vec, normal) => {
    return subtract(vec, multiply(normal, 2 * dot(vec, normal)));
}

const rayIntersectSphere = (orig, dir, sphere) => {
    let l = subtract(sphere.position, orig);
    let tca = dot(l, dir);
    let d2 = dot(l, l) - tca * tca;
    let r2 = sphere.radius * sphere.radius;
    if (d2 > r2)
        return null;
    let thc = Math.sqrt(r2 - d2);
    let t0 = tca - thc;
    let t1 = tca + thc;
    if (t0 < 0)
        t0 = t1;
    if (t0 < 0)
        return null;
    return t0;
}

const sceneIntersect = (orig, dir) => {
    const intersect = () => {
        let intersectedObj = null;
        let dist = Number.MAX_SAFE_INTEGER;

        for (const obj of scene.objects) {
            if (obj.type == 'sphere') {
                let hitDist = rayIntersectSphere(orig, dir, obj);
                if (hitDist !== null && hitDist < dist) {
                    intersectedObj = obj;
                    dist = hitDist;
                }
            }
        }

        return {
            "obj": intersectedObj,
            "dist": dist
        }
    }

    let collision = intersect();
    if (collision.obj != null) {
        collision.hitPoint = add(orig, multiply(dir, collision.dist));
        collision.normal = normalize(subtract(collision.hitPoint, collision.obj.position));
        return collision;
    }

    return null;
}

const castRay = (orig, dir, depth) => {
    if (depth > MAX_DEPTH) {
        return scene.camera.backgroundColor;
    }

    let collision = sceneIntersect(orig, dir);
    if (collision === null) {
        return scene.camera.backgroundColor;
    }

    let material = scene.materials[collision.obj.material];
    let color = getColor(orig, dir, collision, material);
    if (material.albedo[2] > 0) {
        let reflectDir = normalize(reflect(dir, collision.normal));
        let reflectOrig = add(collision.hitPoint, multiply(collision.normal, dot(reflectDir, collision.normal) < 0 ? -EPSILON : EPSILON));
        let reflectColor = castRay(reflectOrig, reflectDir, depth + 1);
        color = add(color, multiply(reflectColor, material.albedo[2]));
    }
    return color;
}

const getColor = (orig, dir, collision, material) => {
    let diffuseIntensity = 0;
    let specularIntensity = 0;
    for (const light of scene.lights) {
        let lightDir = normalize(subtract(light.position, collision.hitPoint));
        let lightDist = length(subtract(light.position, collision.hitPoint));

        let shadowOrig = add(collision.hitPoint, multiply(collision.normal, dot(lightDir, collision.normal) < 0 ? -EPSILON : EPSILON));
        let shadow = sceneIntersect(shadowOrig, lightDir);
        if (shadow !== null && length(subtract(shadow.hitPoint, shadowOrig)) < lightDist) {
            continue;
        }

        diffuseIntensity += Math.max(0, dot(lightDir, collision.normal)) * light.intensity;
        specularIntensity += Math.pow(Math.max(0, dot(reflect(lightDir, collision.normal), dir)), material.specularExponent) * light.intensity;
    }
    let diffuseComponent = multiply(material.diffuseColor, diffuseIntensity * material.albedo[0]);
    let specularComponent = multiply([1, 1, 1], specularIntensity * material.albedo[1]);
    return add(diffuseComponent, specularComponent);
}

let canvas;
let context;

const init = () => {
    canvas = document.getElementById('viewport');
    context = canvas.getContext('2d');

    window.requestAnimationFrame(draw);
}

const clear = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

const draw = () => {
    clear();

    const framebuffer = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let j = 0; j < framebuffer.height; j++) {
        for (let i = 0; i < framebuffer.width; i++) {
            let x = (2 * (i + 0.5) / framebuffer.width - 1) * Math.tan(scene.camera.fov / 2) * framebuffer.width / framebuffer.height;
            let y = -(2 * (j + 0.5) / framebuffer.height - 1) * Math.tan(scene.camera.fov / 2);
            let dir = normalize([x, y, -1]);

            let color = castRay(scene.camera.position, dir, 0);
            let maxIntensity = Math.max(color[0], Math.max(color[1], color[2]));
            if (maxIntensity > 1) {
                color = multiply(color, 1 / maxIntensity);
            }

            let offset = (framebuffer.width * j + i) * 4;
            framebuffer.data[offset] = color[0] * 255;
            framebuffer.data[offset + 1] = color[1] * 255;
            framebuffer.data[offset + 2] = color[2] * 255;
            framebuffer.data[offset + 3] = 255;
        }
    }
    context.putImageData(framebuffer, 0, 0);
}

document.addEventListener('DOMContentLoaded', init);
