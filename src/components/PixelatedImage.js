import React, { useEffect, useRef, useState } from 'react';
import ToolControls from './ToolControls';

function PixelatedImage({ 
    imageFile, 
    pixelWidth, 
    pixelHeight, 
    selectedColor, 
    scale, 
    position, 
    setPosition 
}) {
    const sourceCanvasRef = useRef(null);
    const outputCanvasRef = useRef(null);
    const [isPanning, setIsPanning] = useState(false);
    const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
    const [tool, setTool] = useState('brush');
    const [brushSize, setBrushSize] = useState(1);
    const [lineStart, setLineStart] = useState(null);

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
                    // Ajusta el tamaño de salida (ej. 10x), puedes cambiarlo si quieres otra escala.
                    outputCanvas.width = sourceCanvas.width * 10;
                    outputCanvas.height = sourceCanvas.height * 10;

                    sourceCtx.drawImage(img, 0, 0, pixelWidth, pixelHeight);

                    for (let y = 0; y < pixelHeight; y++) {
                        for (let x = 0; x < pixelWidth; x++) {
                            const pixelData = sourceCtx.getImageData(x, y, 1, 1).data;
                            outputCtx.fillStyle = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
                            outputCtx.fillRect(x * 10, y * 10, 10, 10);
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
        } else if (tool === 'line') {
            const rect = outputCanvasRef.current.getBoundingClientRect();
            const scaleX = outputCanvasRef.current.width / rect.width;
            const scaleY = outputCanvasRef.current.height / rect.height;
            const x = Math.floor((e.clientX - rect.left) * scaleX / 10);
            const y = Math.floor((e.clientY - rect.top) * scaleY / 10);
            setLineStart({ x, y });
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
        } else if (tool !== 'line' && e.buttons) {
            handleCanvasClick(e);
        }
    };

    const handleMouseUp = (e) => {
        setIsPanning(false);

        if (tool === 'line' && lineStart) {
            const rect = outputCanvasRef.current.getBoundingClientRect();
            const scaleX = outputCanvasRef.current.width / rect.width;
            const scaleY = outputCanvasRef.current.height / rect.height;
            const endX = Math.floor((e.clientX - rect.left) * scaleX / 10);
            const endY = Math.floor((e.clientY - rect.top) * scaleY / 10);

            const ctx = outputCanvasRef.current.getContext('2d');
            const dx = Math.abs(endX - lineStart.x);
            const dy = Math.abs(endY - lineStart.y);
            const sx = lineStart.x < endX ? 1 : -1;
            const sy = lineStart.y < endY ? 1 : -1;
            let err = dx - dy;

            let x = lineStart.x;
            let y = lineStart.y;

            while (true) {
                drawSquare(ctx, x, y, selectedColor, brushSize);
                if (x === endX && y === endY) break;
                const e2 = 2 * err;
                if (e2 > -dy) {
                    err -= dy;
                    x += sx;
                }
                if (e2 < dx) {
                    err += dx;
                    y += sy;
                }
            }

            setLineStart(null);
        }
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
    };

    return (
        <div>
            {/* Controles de herramienta (Pincel, Línea, Borrador) */}
            <ToolControls 
                tool={tool} 
                setTool={setTool} 
                brushSize={brushSize} 
                setBrushSize={setBrushSize} 
            />
            <div
                className="canvas-container"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <canvas ref={sourceCanvasRef} style={{ display: 'none' }}></canvas>
                <canvas
                    ref={outputCanvasRef}
                    id="output-canvas"
                    style={{
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                        transformOrigin: 'top left',
                        border: '1px solid #ccc'
                    }}
                ></canvas>
            </div>
        </div>
    );
}

export default PixelatedImage;
