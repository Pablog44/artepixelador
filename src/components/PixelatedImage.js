import React, { useEffect, useRef, useState } from 'react';

function PixelatedImage({ imageFile, pixelWidth, pixelHeight, selectedColor }) {
    const sourceCanvasRef = useRef(null);
    const outputCanvasRef = useRef(null);
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
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
                    outputCanvas.width = pixelWidth * 10;
                    outputCanvas.height = pixelHeight * 10;

                    sourceCtx.drawImage(img, 0, 0, pixelWidth, pixelHeight);

                    for (let y = 0; y < pixelHeight; y++) {
                        for (let x = 0; x < pixelWidth; x++) {
                            const pixelData = sourceCtx.getImageData(x, y, 1, 1).data;
                            outputCtx.fillStyle = `rgba(${pixelData[0]},${pixelData[1]},${pixelData[2]},${pixelData[3]/255})`;
                            outputCtx.fillRect(x * 10, y * 10, 10, 10);
                        }
                    }
                }
                img.src = e.target.result;
            }
            reader.readAsDataURL(imageFile);
        }
    }, [imageFile, pixelWidth, pixelHeight]);

    const handleWheel = (e) => {
        e.preventDefault();
        const newScale = Math.min(Math.max(0.5, scale + e.deltaY * -0.001), 10);
        setScale(newScale);
    };

    const handleMouseDown = (e) => {
        setIsPanning(true);
        setStartCoords({ x: e.clientX - position.x, y: e.clientY - position.y });
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

    return (
        <div 
            ref={containerRef} 
            className="canvas-container"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <canvas ref={sourceCanvasRef} id="source-canvas" style={{display: 'none'}}></canvas>
            <canvas 
                ref={outputCanvasRef} 
                id="output-canvas"
                style={{
                    transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                    transformOrigin: 'top left'
                }}
                onClick={(e) => {
                    const rect = outputCanvasRef.current.getBoundingClientRect();
                    const scaleX = outputCanvasRef.current.width / rect.width;
                    const scaleY = outputCanvasRef.current.height / rect.height;
                    const x = Math.floor((e.clientX - rect.left) * scaleX / 10);
                    const y = Math.floor((e.clientY - rect.top) * scaleY / 10);
                    const ctx = outputCanvasRef.current.getContext('2d');
                    ctx.fillStyle = selectedColor;
                    ctx.fillRect(x * 10, y * 10, 10, 10);
                }}
            ></canvas>
        </div>
    );
}

export default PixelatedImage;
