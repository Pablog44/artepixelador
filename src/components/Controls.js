import React, { useState } from 'react';
import PixelatedImage from './PixelatedImage';

function Controls() {
    const [selectedColor, setSelectedColor] = useState('#ff0000');
    const [pixelWidth, setPixelWidth] = useState(100);
    const [pixelHeight, setPixelHeight] = useState(100);
    const [imageFile, setImageFile] = useState(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleZoomIn = () => {
        setScale(prevScale => Math.min(prevScale + 0.1, 5));
    };

    const handleZoomOut = () => {
        setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
    };

    const handleMove = (direction) => {
        setPosition(prevPosition => {
            switch (direction) {
                case 'up':
                    return { ...prevPosition, y: prevPosition.y - 20 };
                case 'down':
                    return { ...prevPosition, y: prevPosition.y + 20 };
                case 'left':
                    return { ...prevPosition, x: prevPosition.x - 20 };
                case 'right':
                    return { ...prevPosition, x: prevPosition.x + 20 };
                default:
                    return prevPosition;
            }
        });
    };

    return (
        <div className="controls-container">
            <div className="pixelated-image-wrapper">
                <PixelatedImage 
                    imageFile={imageFile} 
                    pixelWidth={pixelWidth} 
                    pixelHeight={pixelHeight} 
                    selectedColor={selectedColor}
                    scale={scale}
                    position={position}
                    setPosition={setPosition}
                />
            </div>
            <div className="controls">
                <input type="file" id="image-upload" onChange={handleFileChange} style={{ display: 'none' }} />
                <label htmlFor="image-upload" className="button">Cargar Imagen</label>
                <label>Ancho: </label>
                <input 
                    type="number" 
                    min="1" 
                    max="200" 
                    value={pixelWidth} 
                    onChange={(e) => setPixelWidth(e.target.value)} 
                    className="input-number"
                />
                <label>Altura: </label>
                <input 
                    type="number" 
                    min="1" 
                    max="200" 
                    value={pixelHeight} 
                    onChange={(e) => setPixelHeight(e.target.value)} 
                    className="input-number"
                />
                <input 
                    type="color" 
                    value={selectedColor} 
                    onChange={(e) => setSelectedColor(e.target.value)} 
                    className="color-picker"
                />
                <button onClick={() => setSelectedColor('transparent')} className="button">Borrar</button>
                <button onClick={handleZoomIn} className="button">Zoom In</button>
                <button onClick={handleZoomOut} className="button">Zoom Out</button>
                <div className="move-controls">
                    <button onClick={() => handleMove('up')} className="button">↑</button>
                    <button onClick={() => handleMove('left')} className="button">←</button>
                    <button onClick={() => handleMove('down')} className="button">↓</button>
                    <button onClick={() => handleMove('right')} className="button">→</button>
                </div>
                <button className="button" onClick={() => {
                    const canvas = document.getElementById('output-canvas');
                    const dataUrl = canvas.toDataURL('image/png', 1.0);  // Exporta a la máxima calidad
                    const a = document.createElement('a');
                    a.href = dataUrl;
                    a.download = 'pixelated-image.png';
                    a.click();
                }}>Descargar</button>
            </div>
        </div>
    );
}

export default Controls;
