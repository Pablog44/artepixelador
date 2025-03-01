// components/Controls.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gifshot from 'gifshot';
import ToolControls from './ToolControls';
import MovementControls from './MovementControls';
import ZoomControls from './ZoomControls';
import FileUpload from './FileUpload';
import DownloadControls from './DownloadControls';
import FramePreview from './FramePreview';
import CanvasWrapper from './CanvasWrapper';

function Controls({ page }) {
  // Estados generales
  const [selectedColor, setSelectedColor] = useState('#e69007');
  const [pixelWidth, setPixelWidth] = useState(100);
  const [pixelHeight, setPixelHeight] = useState(100);
  const [imageFile, setImageFile] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [frames, setFrames] = useState([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(null);
  const [tool, setTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(1);
  const [brushShape, setBrushShape] = useState('square');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Actualizar si se está en dispositivo móvil
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Funciones de interacción
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
    setSelectedFrameIndex(null);
  };

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 5));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.5));
  };

  const handleMove = (direction) => {
    setPosition((prev) => {
      switch (direction) {
        case 'up':
          return { ...prev, y: prev.y - 20 };
        case 'down':
          return { ...prev, y: prev.y + 20 };
        case 'left':
          return { ...prev, x: prev.x - 20 };
        case 'right':
          return { ...prev, x: prev.x + 20 };
        default:
          return prev;
      }
    });
  };

  const handleAgregarFrame = () => {
    const canvas = document.getElementById('output-canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setFrames([...frames, dataUrl]);
    setSelectedFrameIndex(frames.length);
  };

  const handleActualizarFrame = () => {
    if (selectedFrameIndex === null) return;
    const canvas = document.getElementById('output-canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const newFrames = [...frames];
    newFrames[selectedFrameIndex] = dataUrl;
    setFrames(newFrames);
  };

  const handleEliminarFrame = () => {
    if (selectedFrameIndex === null) return;
    const newFrames = frames.filter((_, index) => index !== selectedFrameIndex);
    setFrames(newFrames);
    if (newFrames.length === 0) {
      setSelectedFrameIndex(null);
    } else if (selectedFrameIndex >= newFrames.length) {
      setSelectedFrameIndex(newFrames.length - 1);
    }
  };

  const handleDownloadPng = () => {
    const originalCanvas = document.getElementById('output-canvas');
    if (!originalCanvas) return;
    const minDownloadSize = 1000;
    const currentWidth = originalCanvas.width;
    const scaleFactor = currentWidth < minDownloadSize ? Math.ceil(minDownloadSize / currentWidth) : 1;

    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = originalCanvas.width * scaleFactor;
    downloadCanvas.height = originalCanvas.height * scaleFactor;
    const ctx = downloadCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(originalCanvas, 0, 0, downloadCanvas.width, downloadCanvas.height);
    const dataUrl = downloadCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'pixelated-image.png';
    a.click();
  };

  const handleDownloadGif = async () => {
    if (frames.length === 0) return;
    const minDownloadSize = 1000;
    const originalCanvas = document.getElementById('output-canvas');
    const currentWidth = originalCanvas ? originalCanvas.width : pixelWidth * 10;
    const scaleFactor = currentWidth < minDownloadSize ? Math.ceil(minDownloadSize / currentWidth) : 1;
    const finalGifWidth = originalCanvas ? originalCanvas.width * scaleFactor : pixelWidth * 10;
    const finalGifHeight = originalCanvas ? originalCanvas.height * scaleFactor : pixelHeight * 10;

    const upscaleFrame = (frameDataUrl) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = originalCanvas ? originalCanvas.width * scaleFactor : pixelWidth * 10;
          tempCanvas.height = originalCanvas ? originalCanvas.height * scaleFactor : pixelHeight * 10;
          const ctx = tempCanvas.getContext('2d');
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
          resolve(tempCanvas.toDataURL('image/png'));
        };
        img.src = frameDataUrl;
      });
    };

    const upscaledFrames = await Promise.all(frames.map(upscaleFrame));

    gifshot.createGIF(
      {
        images: upscaledFrames,
        gifWidth: finalGifWidth,
        gifHeight: finalGifHeight,
        numFrames: upscaledFrames.length,
        frameDuration: 0.6,
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

  // Para enviar a la vista del canvas (PixelatedImage o Rejilla)
  const frameData = selectedFrameIndex !== null ? frames[selectedFrameIndex] : null;

  // Estilos para los tooltips
  const tooltipStyles = `
    .tooltip-button {
      position: relative;
    }
    .tooltip-button:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      background: #333;
      color: #fff;
      padding: 2px 5px;
      border-radius: 3px;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
      font-size: 12px;
      z-index: 100;
    }
  `;

  return (
    <div className="controls-container">
      <style>{tooltipStyles}</style>
      <div 
        className="pixelated-image-wrapper" 
        onWheel={handleWheel}
      >
        <CanvasWrapper
          page={page}
          imageFile={imageFile}
          frameData={frameData}
          pixelWidth={pixelWidth}
          pixelHeight={pixelHeight}
          selectedColor={selectedColor}
          scale={scale}
          position={position}
          setPosition={setPosition}
          tool={tool}
          brushSize={brushSize}
          brushShape={brushShape}
        />
      </div>

      <FramePreview
        frames={frames}
        selectedFrameIndex={selectedFrameIndex}
        setSelectedFrameIndex={setSelectedFrameIndex}
      />

      {/* Contenedor para centrar el botón de menú en móviles */}
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <button
            className="button"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ width: 40 }}
          >
            {menuOpen ? (
              // SVG para cerrar menú
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m19 9-7 7-7-7"
                />
              </svg>
            ) : (
              // SVG para abrir menú
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m5 15 7-7 7 7"
                />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Renderizado según si es vista de escritorio o móvil */}
      {!isMobile ? (
        <div className="controls">
          <div className="controls-group">
            {page === 'rejilla' ? (
              <Link to="/" className="button" style={{ margin: '0 8px' }}>
                Sin rejilla
              </Link>
            ) : (
              <Link to="/rejilla" className="button" style={{ margin: '0 8px' }}>
                Con rejilla
              </Link>
            )}
          </div>

          <FileUpload handleFileChange={handleFileChange} />
          <DownloadControls
            handleDownloadPng={handleDownloadPng}
            handleDownloadGif={handleDownloadGif}
          />

          <div className="controls-group">
            <label>Ancho: </label>
            <input
              type="number"
              min="1"
              max="200"
              value={pixelWidth}
              onChange={(e) => setPixelWidth(Number(e.target.value))}
              className="input-number"
              style={{ margin: '0 8px' }}
            />
            <label>Altura: </label>
            <input
              type="number"
              min="1"
              max="200"
              value={pixelHeight}
              onChange={(e) => setPixelHeight(Number(e.target.value))}
              className="input-number"
              style={{ margin: '0 8px' }}
            />
          </div>

          <div className="controls-group">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="color-picker"
              style={{ margin: '0 8px' }}
            />
          </div>

          <ZoomControls
            handleZoomIn={handleZoomIn}
            handleZoomOut={handleZoomOut}
          />

          <MovementControls handleMove={handleMove} />

          <div className="controls-group">
            <button className="button" onClick={handleAgregarFrame} style={{ margin: '0 8px' }}>
              Agregar Frame
            </button>
            <button
              className="button"
              onClick={handleActualizarFrame}
              style={{ margin: '0 8px' }}
              disabled={selectedFrameIndex === null}
            >
              Actualizar Frame
            </button>
            <button
              className="button"
              onClick={handleEliminarFrame}
              style={{ margin: '0 8px' }}
              disabled={selectedFrameIndex === null}
            >
              Eliminar Frame
            </button>
            <button className="button" onClick={handleDownloadGif} style={{ margin: '0 8px' }}>
              Descargar GIF
            </button>
          </div>

          <ToolControls
            isMobile={false}
            tool={tool}
            setTool={setTool}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            brushShape={brushShape}
            setBrushShape={setBrushShape}
          />
        </div>
      ) : (
        // Vista móvil: si el menú está abierto se muestran todos los controles;
        // en la vista mínima se muestran solo algunos y los ToolControls se disponen horizontalmente.
        menuOpen ? (
          <div className="controls">
            <div className="controls-group">
              {page === 'rejilla' ? (
                <Link to="/" className="button" style={{ margin: '0 8px' }}>
                  Sin rejilla
                </Link>
              ) : (
                <Link to="/rejilla" className="button" style={{ margin: '0 8px' }}>
                  Con rejilla
                </Link>
              )}
            </div>
            <FileUpload handleFileChange={handleFileChange} />
            <DownloadControls
              handleDownloadPng={handleDownloadPng}
              handleDownloadGif={handleDownloadGif}
            />
            <div className="controls-group">
              <label>Ancho: </label>
              <input
                type="number"
                min="1"
                max="200"
                value={pixelWidth}
                onChange={(e) => setPixelWidth(Number(e.target.value))}
                className="input-number"
                style={{ margin: '0 8px' }}
              />
              <label>Altura: </label>
              <input
                type="number"
                min="1"
                max="200"
                value={pixelHeight}
                onChange={(e) => setPixelHeight(Number(e.target.value))}
                className="input-number"
                style={{ margin: '0 8px' }}
              />
            </div>
            <div className="controls-group">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="color-picker"
                style={{ margin: '0 8px' }}
              />
            </div>
            <ZoomControls
              handleZoomIn={handleZoomIn}
              handleZoomOut={handleZoomOut}
            />
            <MovementControls handleMove={handleMove} />
            <div className="controls-group">
              <button className="button" onClick={handleAgregarFrame} style={{ margin: '0 8px' }}>
                Agregar Frame
              </button>
              <button
                className="button"
                onClick={handleActualizarFrame}
                style={{ margin: '0 8px' }}
                disabled={selectedFrameIndex === null}
              >
                Actualizar Frame
              </button>
              <button
                className="button"
                onClick={handleEliminarFrame}
                style={{ margin: '0 8px' }}
                disabled={selectedFrameIndex === null}
              >
                Eliminar Frame
              </button>
              <button className="button" onClick={handleDownloadGif} style={{ margin: '0 8px' }}>
                Descargar GIF
              </button>
            </div>
            <ToolControls
              isMobile={true}
              tool={tool}
              setTool={setTool}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              brushShape={brushShape}
              setBrushShape={setBrushShape}
            />
          </div>
        ) : (
          <div className="minimal-mobile-controls">
            <div className="controls-group">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="color-picker"
                style={{ margin: '0 8px' }}
              />
            </div>
            <ZoomControls
              handleZoomIn={handleZoomIn}
              handleZoomOut={handleZoomOut}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateAreas: `" . up ."
                                    "left . right"
                                    " . down ."`,
                gridGap: '5px',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '10px 0'
              }}
            >
              <button style={{ gridArea: 'up' }} className="button" onClick={() => handleMove('up')}>
                ↑
              </button>
              <button style={{ gridArea: 'left' }} className="button" onClick={() => handleMove('left')}>
                ←
              </button>
              <button style={{ gridArea: 'right' }} className="button" onClick={() => handleMove('right')}>
                →
              </button>
              <button style={{ gridArea: 'down' }} className="button" onClick={() => handleMove('down')}>
                ↓
              </button>
            </div>
            <ToolControls
              isMobile={true}
              tool={tool}
              setTool={setTool}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              brushShape={brushShape}
              setBrushShape={setBrushShape}
            />
          </div>
        )
      )}
    </div>
  );
}

export default Controls;
