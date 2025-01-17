import React, { useEffect, useRef, useState } from 'react';
import ToolControls from './ToolControls'; // Asegúrate de importar ToolControls correctamente

function Rejilla({ imageFile, pixelWidth, pixelHeight, selectedColor, scale, position, setPosition }) {
    const sourceCanvasRef = useRef(null);
    const outputCanvasRef = useRef(null);
    const [isPanning, setIsPanning] = useState(false);
    const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });

    // Ahora podemos elegir la herramienta y el tamaño del pincel.
    const [tool, setTool] = useState('brush'); // brush, eraser, line, etc.
    const [brushSize, setBrushSize] = useState(1); // Tamaño del pincel (1x1, 2x2, etc.)

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

                    // Pintamos la imagen pixelada
                    sourceCtx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
                    for (let y = 0; y < pixelHeight; y++) {
                        for (let x = 0; x < pixelWidth; x++) {
                            const pixelData = sourceCtx.getImageData(x, y, 1, 1).data;
                            outputCtx.fillStyle = `rgba(${pixelData[0]},${pixelData[1]},${pixelData[2]},${pixelData[3] / 255})`;
                            // Dibujamos un recuadro de 9x9 para simular la línea
                            outputCtx.fillRect(x * 10, y * 10, 9, 9);

                            // Dibujamos la cuadrícula alrededor
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

    // Rellenar un pixel (tamaño 1)
    const drawSquare = (ctx, x, y, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x * 10, y * 10, 9, 9);
    };

    // Borrar un pixel (tamaño 1)
    const clearSquare = (ctx, x, y) => {
        // Limpiamos la zona de 9x9
        ctx.clearRect(x * 10, y * 10, 9, 9);
    };

    const handleMouseDown = (e) => {
        if (e.ctrlKey) {
            // Iniciar panning (arrastre) si se mantiene Ctrl (en desktop)
            setIsPanning(true);
            setStartCoords({ x: e.clientX - position.x, y: e.clientY - position.y });
        } else {
            // Dibujar/Borrar
            handleCanvasClick(e);
        }
    };

    const handleMouseMove = (e) => {
        if (isPanning) {
            // Mover el canvas
            setPosition({
                x: e.clientX - startCoords.x,
                y: e.clientY - startCoords.y,
            });
        } else if (e.buttons) {
            // Si tenemos el botón presionado, continuamos pintando/borrando
            handleCanvasClick(e);
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    const handleCanvasClick = (e) => {
        // Si estamos en modo panning, no pintamos
        if (e.ctrlKey || isPanning) return;

        const rect = outputCanvasRef.current.getBoundingClientRect();
        const scaleX = outputCanvasRef.current.width / rect.width;
        const scaleY = outputCanvasRef.current.height / rect.height;
        const startX = Math.floor(((e.clientX - rect.left) * scaleX) / 10);
        const startY = Math.floor(((e.clientY - rect.top) * scaleY) / 10);

        const ctx = outputCanvasRef.current.getContext('2d');

        // Recorremos cada "pixel" dentro del tamaño de pincel
        for (let i = 0; i < brushSize; i++) {
            for (let j = 0; j < brushSize; j++) {
                const px = startX + i;
                const py = startY + j;

                if (tool === 'eraser') {
                    clearSquare(ctx, px, py);
                } else if (tool === 'brush') {
                    drawSquare(ctx, px, py, selectedColor);
                }

                // Volvemos a dibujar el contorno de la rejilla en ese pixel
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 1;
                ctx.strokeRect(px * 10 + 0.5, py * 10 + 0.5, 9, 9);
            }
        }
    };

    return (
        <div>
            {/* Controles de herramienta (pincel, borrador, etc.) y tamaño de pincel */}
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
                onClick={handleCanvasClick}
                style={{ 
                    // Evita que el usuario seleccione texto en el canvas
                    userSelect: 'none',
                }}
            >
                {/* Canvas base (oculto) para procesamiento de la imagen original */}
                <canvas ref={sourceCanvasRef} style={{ display: 'none' }}></canvas>

                {/* Canvas de salida con la rejilla */}
                <canvas
                    ref={outputCanvasRef}
                    id="output-canvas"
                    style={{
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                        transformOrigin: 'top left',
                        border: '1px solid #ccc',
                    }}
                ></canvas>
            </div>
        </div>
    );
}

export default Rejilla;
