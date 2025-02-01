import React, { useState } from 'react';
import PixelatedImage from './PixelatedImage';
import Rejilla from './Rejilla';
import { Link } from 'react-router-dom';
import gifshot from 'gifshot';

function Controls({ page }) {
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [pixelWidth, setPixelWidth] = useState(100);
  const [pixelHeight, setPixelHeight] = useState(100);
  const [imageFile, setImageFile] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Estados para manejar los frames del GIF y la selección de un frame para editar
  const [frames, setFrames] = useState([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(null);

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
    setSelectedFrameIndex(null); // Se limpia la selección si se carga una nueva imagen
  };

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 5));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.5));
  };

  const handleMove = (direction) => {
    setPosition((prevPosition) => {
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

  // Al presionar “Agregar Frame” se actualiza el frame seleccionado (si existe) o se añade uno nuevo
  const handleAddFrame = () => {
    const canvas = document.getElementById('output-canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    if (selectedFrameIndex !== null) {
      // Actualiza el frame ya existente
      const newFrames = [...frames];
      newFrames[selectedFrameIndex] = dataUrl;
      setFrames(newFrames);
    } else {
      // Agrega un nuevo frame
      setFrames([...frames, dataUrl]);
    }
  };

  // Función para descargar el GIF usando la librería gifshot
  const handleDownloadGif = () => {
    if (frames.length === 0) return;
    gifshot.createGIF(
      {
        images: frames,
        gifWidth: pixelWidth * 10, // Debe coincidir con la escala del canvas
        gifHeight: pixelHeight * 10,
        numFrames: frames.length,
        frameDuration: 0.5, // segundos entre cada frame
      },
      function (obj) {
        if (!obj.error) {
          const { image } = obj;
          const a = document.createElement('a');
          a.href = image;
          a.download = 'animation.gif';
          a.click();
        } else {
          console.error('Error creando GIF:', obj.errorMsg);
        }
      }
    );
  };

  // Se decide qué componente hijo mostrar (PixelatedImage o Rejilla)
  const renderChildComponent = () => {
    if (page === 'rejilla') {
      return (
        <Rejilla
          imageFile={imageFile}
          pixelWidth={pixelWidth}
          pixelHeight={pixelHeight}
          selectedColor={selectedColor}
          scale={scale}
          position={position}
          setPosition={setPosition}
        />
      );
    } else {
      return (
        <PixelatedImage
          imageFile={imageFile}
          frameData={selectedFrameIndex !== null ? frames[selectedFrameIndex] : null}
          pixelWidth={pixelWidth}
          pixelHeight={pixelHeight}
          selectedColor={selectedColor}
          scale={scale}
          position={position}
          setPosition={setPosition}
        />
      );
    }
  };

  const buttonStyle = { margin: '0 8px' };

  return (
    <div className="controls-container">
      <div className="pixelated-image-wrapper">
        {renderChildComponent()}
      </div>

      {/* Previsualización de frames */}
      <div className="frames-preview" style={{ margin: '10px 0' }}>
        {frames.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {frames.map((frame, index) => (
              <img
                key={index}
                src={frame}
                alt={`Frame ${index}`}
                onClick={() => setSelectedFrameIndex(index)}
                style={{
                  width: '50px',
                  height: '50px',
                  border: selectedFrameIndex === index ? '2px solid blue' : '1px solid #ccc',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="controls">
        <div className="controls-group">
          {page === 'rejilla' ? (
            <Link to="/" className="button" style={buttonStyle}>
              Sin rejilla
            </Link>
          ) : (
            <Link to="/rejilla" className="button" style={buttonStyle}>
              Con rejilla
            </Link>
          )}
        </div>
        
        <div className="controls-group">
          <input
            type="file"
            id="image-upload"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="image-upload" className="button" style={buttonStyle}>
            Cargar Imagen
          </label>
          <button
            className="button"
            onClick={() => {
              const canvas = document.getElementById('output-canvas');
              if (!canvas) return;
              const dataUrl = canvas.toDataURL('image/png', 1.0);
              const a = document.createElement('a');
              a.href = dataUrl;
              a.download = 'pixelated-image.png';
              a.click();
            }}
            style={buttonStyle}
          >
            Descargar PNG
          </button>
        </div>

        <div className="controls-group">
          <label>Ancho: </label>
          <input
            type="number"
            min="1"
            max="200"
            value={pixelWidth}
            onChange={(e) => setPixelWidth(Number(e.target.value))}
            className="input-number"
            style={buttonStyle}
          />
          <label>Altura: </label>
          <input
            type="number"
            min="1"
            max="200"
            value={pixelHeight}
            onChange={(e) => setPixelHeight(Number(e.target.value))}
            className="input-number"
            style={buttonStyle}
          />
        </div>

        <div className="controls-group">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="color-picker"
            style={buttonStyle}
          />
          <button
            onClick={() => setSelectedColor('transparent')}
            className="button"
            style={buttonStyle}
          >
            Borrar
          </button>
        </div>

        <div className="controls-group">
          <button onClick={handleZoomIn} className="button" style={buttonStyle}>
            Zoom In
          </button>
          <button onClick={handleZoomOut} className="button" style={buttonStyle}>
            Zoom Out
          </button>
        </div>

        <div className="move-controls">
          <button onClick={() => handleMove('up')} className="button" style={buttonStyle}>
            ↑
          </button>
          <button onClick={() => handleMove('left')} className="button" style={buttonStyle}>
            ←
          </button>
          <button onClick={() => handleMove('down')} className="button" style={buttonStyle}>
            ↓
          </button>
          <button onClick={() => handleMove('right')} className="button" style={buttonStyle}>
            →
          </button>
        </div>

        {/* Botones para guardar frame / actualizar y descargar el GIF */}
        <div className="controls-group">
          <button className="button" onClick={handleAddFrame} style={buttonStyle}>
            {selectedFrameIndex !== null ? 'Actualizar Frame' : 'Agregar Frame'}
          </button>
          <button className="button" onClick={handleDownloadGif} style={buttonStyle}>
            Descargar GIF
          </button>
        </div>
      </div>
    </div>
  );
}

export default Controls;
