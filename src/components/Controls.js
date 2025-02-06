import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gifshot from 'gifshot';
import PixelatedImage from './PixelatedImage';
import Rejilla from './Rejilla';

function Controls({ page }) {
  const [selectedColor, setSelectedColor] = useState('#e69007');
  const [pixelWidth, setPixelWidth] = useState(100);
  const [pixelHeight, setPixelHeight] = useState(100);
  const [imageFile, setImageFile] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Estados para manejar los frames del GIF y la selección de uno para editar
  const [frames, setFrames] = useState([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(null);

  // Estados para control de herramienta, tamaño y forma del pincel
  const [tool, setTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(1);
  const [brushShape, setBrushShape] = useState('square'); // 'square' o 'circle'

  // Estados para la vista móvil
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Actualiza el estado de "isMobile" cuando cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Al cargar una imagen se limpia la selección de frame
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

  // Función para agregar un nuevo frame (guarda el contenido actual del canvas)
  const handleAgregarFrame = () => {
    const canvas = document.getElementById('output-canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setFrames([...frames, dataUrl]);
    setSelectedFrameIndex(frames.length);
  };

  // Función para actualizar el frame seleccionado
  const handleActualizarFrame = () => {
    if (selectedFrameIndex === null) return;
    const canvas = document.getElementById('output-canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const newFrames = [...frames];
    newFrames[selectedFrameIndex] = dataUrl;
    setFrames(newFrames);
  };

  // Función para eliminar el frame seleccionado
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

  // Función para descargar PNG con calidad ajustada
  const handleDownloadPng = () => {
    const originalCanvas = document.getElementById('output-canvas');
    if (!originalCanvas) return;
    // Se define un tamaño mínimo deseado para el ancho descargado (por ejemplo, 1000px)
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

  // Función para descargar GIF con calidad ajustada
  const handleDownloadGif = async () => {
    if (frames.length === 0) return;
    // Se define un tamaño mínimo deseado para el ancho descargado (por ejemplo, 1000px)
    const minDownloadSize = 1000;
    const originalCanvas = document.getElementById('output-canvas');
    const currentWidth = originalCanvas ? originalCanvas.width : pixelWidth * 10;
    const scaleFactor = currentWidth < minDownloadSize ? Math.ceil(minDownloadSize / currentWidth) : 1;
    const finalGifWidth = originalCanvas ? originalCanvas.width * scaleFactor : pixelWidth * 10;
    const finalGifHeight = originalCanvas ? originalCanvas.height * scaleFactor : pixelHeight * 10;

    // Función que recibe un frame (dataURL) y lo escala en un canvas temporal
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

  // Se decide qué componente hijo mostrar (PixelatedImage o Rejilla)
  const renderChildComponent = () => {
    if (page === 'rejilla') {
      return (
        <Rejilla
          imageFile={imageFile}
          frameData={selectedFrameIndex !== null ? frames[selectedFrameIndex] : null}  // Se pasa frameData
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
          tool={tool}
          brushSize={brushSize}
          brushShape={brushShape}
        />
      );
    }
  };

  const buttonStyle = { margin: '0 8px' };

  // Subcomponente para los controles de herramienta, tamaño y forma
  const ToolControls = ({ tool, setTool, brushSize, setBrushSize, brushShape, setBrushShape }) => {
    return (
      <div className="tool-controls">
        <label>
          Modo:
          <select value={tool} onChange={(e) => setTool(e.target.value)}>
            <option value="brush">Pincel</option>
            <option value="line">Línea</option>
            <option value="eraser">Borrador</option>
          </select>
        </label>
        <label>
          Tamaño:
          <select value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))}>
            <option value={1}>1x1</option>
            <option value={2}>2x2</option>
            <option value={3}>3x3</option>
            <option value={4}>4x4</option>
          </select>
        </label>
        <label>
          Forma:
          <select value={brushShape} onChange={(e) => setBrushShape(e.target.value)}>
            <option value="square">Cuadrado</option>
            <option value="circle">Círculo</option>
          </select>
        </label>
      </div>
    );
  };

  return (
    <div className="controls-container">
      {/* Área de trabajo */}
      <div className="pixelated-image-wrapper">{renderChildComponent()}</div>

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
                  border: selectedFrameIndex === index ? '2px solid orange' : '1px solid #ccc',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Botón de menú (solo se muestra en vista móvil) */}
      {isMobile && (
        <button
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ marginBottom: '10px' }}
        >
          {menuOpen ? 'Cerrar Menú' : 'Abrir Menú'}
        </button>
      )}

      {/* Controles según la vista y el estado del menú */}
      {!isMobile ? (
        // Vista de escritorio: se muestran todos los controles
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
              onClick={handleDownloadPng}
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

          <div className="controls-group">
            <button className="button" onClick={handleAgregarFrame} style={buttonStyle}>
              Agregar Frame
            </button>
            <button
              className="button"
              onClick={handleActualizarFrame}
              style={buttonStyle}
              disabled={selectedFrameIndex === null}
            >
              Actualizar Frame
            </button>
            <button
              className="button"
              onClick={handleEliminarFrame}
              style={buttonStyle}
              disabled={selectedFrameIndex === null}
            >
              Eliminar Frame
            </button>
            <button className="button" onClick={handleDownloadGif} style={buttonStyle}>
              Descargar GIF
            </button>
          </div>

          {/* Controles de herramienta, tamaño y forma */}
          <ToolControls
            tool={tool}
            setTool={setTool}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            brushShape={brushShape}
            setBrushShape={setBrushShape}
          />
        </div>
      ) : (
        // Vista móvil
        menuOpen ? (
          // Menú abierto: se muestran TODOS los controles
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
                onClick={handleDownloadPng}
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

            <div className="controls-group">
              <button className="button" onClick={handleAgregarFrame} style={buttonStyle}>
                Agregar Frame
              </button>
              <button
                className="button"
                onClick={handleActualizarFrame}
                style={buttonStyle}
                disabled={selectedFrameIndex === null}
              >
                Actualizar Frame
              </button>
              <button
                className="button"
                onClick={handleEliminarFrame}
                style={buttonStyle}
                disabled={selectedFrameIndex === null}
              >
                Eliminar Frame
              </button>
              <button className="button" onClick={handleDownloadGif} style={buttonStyle}>
                Descargar GIF
              </button>
            </div>

            {/* Controles de herramienta, tamaño y forma */}
            <ToolControls
              tool={tool}
              setTool={setTool}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              brushShape={brushShape}
              setBrushShape={setBrushShape}
            />
          </div>
        ) : (
          // Menú cerrado: se muestran SOLO el selector de color, los botones de zoom, las flechas (dispuestas como gamepad) y los desplegables de modo, tamaño y forma.
          <div className="minimal-mobile-controls">
            <div className="controls-group">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="color-picker"
                style={buttonStyle}
              />
            </div>

            <div className="controls-group">
              <button onClick={handleZoomIn} className="button" style={buttonStyle}>
                Zoom In
              </button>
              <button onClick={handleZoomOut} className="button" style={buttonStyle}>
                Zoom Out
              </button>
            </div>

            <div
              className="move-controls"
              style={{
                display: 'grid',
                gridTemplateAreas: `" . up ."
                                    "left . right"
                                    " . down ."`
                ,
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
