import React, { useEffect, useRef, useState } from 'react';

function PixelatedImage({ imageFile, pixelWidth, pixelHeight, selectedColor, scale, position, setPosition }) {
    const sourceCanvasRef = useRef(null);
    const outputCanvasRef = useRef(null);
    const [isPanning, setIsPanning] = useState(false);
    const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const sourceCanvas = sourceCanvasRef.current;
                    const outputCanvas = outputCanvasRef.current;
                    const sourceCtx = sourceCanvas.getContext('2d');
                    const outputCtx = outputCanvas.getContext('2d');
                    
                    sourceCanvas.width = pixelWidth;
                    sourceCanvas.height = pixelHeight;
                    outputCanvas.width = sourceCanvas.width * 10;
                    outputCanvas.height = sourceCanvas.height * 10;

                    sourceCtx.drawImage(img, 0, 0, sourceCanvas.width, sourceCanvas.height);

                    for (let y = 0; y < sourceCanvas.height; y++) {
                        for (let x = 0; x < sourceCanvas.width; x++) {
                            const pixelData = sourceCtx.getImageData(x, y, 1, 1).data;
                            outputCtx.fillStyle = `rgba(${pixelData[0]},${pixelData[1]},${pixelData[2]},${pixelData[3]/255})`;
                            outputCtx.fillRect(x * 10, y * 10, 10, 10);
                        }
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(imageFile);
        }
    }, [imageFile, pixelWidth, pixelHeight]);

    const handleMouseDown = (e) => {
        if (e.ctrlKey) {
            setIsPanning(true);
            setStartCoords({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isPanning) {
            setPosition({
                x: e.clientX - startCoords.x,
                y: e.clientY - startCoords.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    const handleCanvasClick = (e) => {
        if (e.ctrlKey || isPanning) return; // Evita colorear si Ctrl está presionado o si se está desplazando

        const rect = outputCanvasRef.current.getBoundingClientRect();
        const scaleX = outputCanvasRef.current.width / rect.width;
        const scaleY = outputCanvasRef.current.height / rect.height;
        const x = Math.floor((e.clientX - rect.left) * scaleX / 10);
        const y = Math.floor((e.clientY - rect.top) * scaleY / 10);
        const ctx = outputCanvasRef.current.getContext('2d');

        if (selectedColor === 'transparent') {
            ctx.clearRect(x * 10, y * 10, 10, 10); // Borra el píxel
        } else {
            ctx.fillStyle = selectedColor;
            ctx.fillRect(x * 10, y * 10, 10, 10);
        }
    };

    return (
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
                    width: '100%',
                    height: '100%'
                }}
            ></canvas>
        </div>
    );
}

export default PixelatedImage;
