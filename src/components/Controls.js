import React, { useState } from 'react';
import PixelatedImage from './PixelatedImage';

function Controls() {
    const [selectedColor, setSelectedColor] = useState('red');
    const [pixelWidth, setPixelWidth] = useState(100);
    const [pixelHeight, setPixelHeight] = useState(100);
    const [imageFile, setImageFile] = useState(null);

    const handleColorChange = (color) => {
        setSelectedColor(color);
    };

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    return (
        <div className="controls-container">
            <input type="file" onChange={handleFileChange} />
            <div>
                <label>Ancho de pixel: </label>
                <input 
                    type="number" 
                    min="1" 
                    max="200" 
                    value={pixelWidth} 
                    onChange={(e) => setPixelWidth(e.target.value)} 
                />
            </div>
            <div>
                <label>Altura de pixel: </label>
                <input 
                    type="number" 
                    min="1" 
                    max="200" 
                    value={pixelHeight} 
                    onChange={(e) => setPixelHeight(e.target.value)} 
                />
            </div>
            <div id="color-palette">
                <input 
                    type="color" 
                    value={selectedColor} 
                    onChange={(e) => setSelectedColor(e.target.value)} 
                />
            </div>
            <PixelatedImage 
                imageFile={imageFile} 
                pixelWidth={pixelWidth} 
                pixelHeight={pixelHeight} 
                selectedColor={selectedColor} 
            />
            <button className="download-btn" onClick={() => {
                const canvas = document.getElementById('output-canvas');
                const dataUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = 'pixelated-image.png';
                a.click();
            }}>Descargar imagen</button>
        </div>
    );
}

export default Controls;
