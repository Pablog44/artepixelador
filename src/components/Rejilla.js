import React, { useEffect, useRef, useState } from 'react';
import ToolControls from './ToolControls'; // Asegúrate de importar ToolControls correctamente

function Rejilla({ imageFile, pixelWidth, pixelHeight, selectedColor, scale, position, setPosition }) {
    const sourceCanvasRef = useRef(null);
    const outputCanvasRef = useRef(null);
    const [isPanning, setIsPanning] = useState(false);
    const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
    const [tool, setTool] = useState('brush'); // brush, eraser, line, etc.
    const [brushSize, setBrushSize] = useState(1); // Tamaño del pincel

    useEffect(() => {
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    const sourceCanvas = sourceCanvasRef.current;
                    const outputCanvas = outputCanvasRef.current;
                    const sourceCtx = sourceCanvas.getContext('2d');
                    const outputCtx = outputCanvas.getContext('2d');

                    sourceCanvas.width = pixelWidth;
                    sourceCanvas.height = pixelHeight;
                    outputCanvas.width = sourceCanvas.width * 10;
                    outputCanvas.height = sourceCanvas.height * 10;

                    sourceCtx.drawImage(img, 0, 0, pixelWidth, pixelHeight);

                    for (let y = 0; y < pixelHeight; y++) {
                        for (let x = 0; x < pixelWidth; x++) {
                            const pixelData = sourceCtx.getImageData(x, y, 1, 1).data;
                            outputCtx.fillStyle = `rgba(${pixelData[0]},${pixelData[1]},${pixelData[2]},${pixelData[3] / 255})`;
                            outputCtx.fillRect(x * 10, y * 10, 9, 9);

                            // Dibujar la cuadrícula
                            outputCtx.strokeStyle = 'black';
                            outputCtx.lineWidth = 1;
                            outputCtx.strokeRect(x * 10 + 0.5, y * 10 + 0.5, 9, 9);
                        }
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(imageFile);
        }
    }, [imageFile, pixelWidth, pixelHeight]);

    const drawSquare = (ctx, x, y, color, size) => {
        ctx.fillStyle = color;
        ctx.fillRect(x * 10, y * 10, 10 * size, 10 * size);
    };

    const clearSquare = (ctx, x, y, size) => {
        ctx.clearRect(x * 10, y * 10, 10 * size, 10 * size);
    };

    const handleMouseDown = (e) => {
        if (e.ctrlKey) {
            setIsPanning(true);
            setStartCoords({ x: e.clientX - position.x, y: e.clientY - position.y });
        } else {
            handleCanvasClick(e);
        }
    };

    const handleMouseMove = (e) => {
        if (isPanning) {
            setPosition({
                x: e.clientX - startCoords.x,
                y: e.clientY - startCoords.y,
            });
        } else if (e.buttons) {
            handleCanvasClick(e);
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    const handleCanvasClick = (e) => {
        if (e.ctrlKey || isPanning) return;

        const rect = outputCanvasRef.current.getBoundingClientRect();
        const scaleX = outputCanvasRef.current.width / rect.width;
        const scaleY = outputCanvasRef.current.height / rect.height;
        const x = Math.floor((e.clientX - rect.left) * scaleX / 10);
        const y = Math.floor((e.clientY - rect.top) * scaleY / 10);
        const ctx = outputCanvasRef.current.getContext('2d');

        if (tool === 'eraser') {
            clearSquare(ctx, x, y, brushSize);
        } else if (tool === 'brush') {
            drawSquare(ctx, x, y, selectedColor, brushSize);
        }

        // Redibujar la cuadrícula sobre el píxel coloreado
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * 10 + 0.5, y * 10 + 0.5, 9, 9);
    };

    return (
        <div>
            <ToolControls tool={tool} setTool={setTool} brushSize={brushSize} setBrushSize={setBrushSize} />
            <div
                className="canvas-container"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleCanvasClick}
            >
                <canvas ref={sourceCanvasRef} style={{ display: 'none' }}></canvas>
                <canvas
                    ref={outputCanvasRef}
                    id="output-canvas"
                    style={{
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                        transformOrigin: 'top left',
                    }}
                ></canvas>
            </div>
        </div>
    );
}

export default Rejilla;
