let canvas;
let context;

const init = () => {
    canvas = document.getElementById("viewport");
    context = canvas.getContext("2d");
    
    window.requestAnimationFrame(draw);
}

const clear = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

const draw = () => {
    clear();
    
    const img = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < 255; y++) {
        for (let x = 0; x < 255; x++) {
            let r = y;
            let g = x;
            let b = 0;
            
            let offset = (img.width * y + x) * 4;
            img.data[offset] = r;
            img.data[offset + 1] = g;
            img.data[offset + 2] = b;
            img.data[offset + 3] = 255;
        }
    }
    context.putImageData(img, 0, 0);
}

document.addEventListener("DOMContentLoaded", init);
