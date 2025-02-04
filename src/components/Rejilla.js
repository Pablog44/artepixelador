import React, { useEffect, useRef, useState } from 'react';
import ToolControls from './ToolControls';

function Rejilla({ 
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

  // Estados para la herramienta y el tamaño del pincel
  const [tool, setTool] = useState('brush'); // Puede ser 'brush', 'eraser', etc.
  const [brushSize, setBrushSize] = useState(1);

  // Calcula el tamaño base de cada "píxel" para que el canvas ocupe aproximadamente el 90% de la ventana
  const basePixelSize = Math.floor(
    Math.min(
      window.innerWidth * 0.9 / pixelWidth,
      window.innerHeight * 0.9 / pixelHeight
    )
  );

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

          // Configuramos los canvas:
          // - El canvas fuente se ajusta a la resolución de la grilla.
          // - El canvas de salida se escala usando basePixelSize.
          sourceCanvas.width = pixelWidth;
          sourceCanvas.height = pixelHeight;
          outputCanvas.width = pixelWidth * basePixelSize;
          outputCanvas.height = pixelHeight * basePixelSize;

          // Desactivar el suavizado para lograr el efecto pixelado
          sourceCtx.imageSmoothingEnabled = false;
          outputCtx.imageSmoothingEnabled = false;

          // Dibujar la imagen en el canvas fuente reducida a la resolución de la grilla
          sourceCtx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
          outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

          // Recorrer cada "píxel" y dibujarlo en el canvas de salida
          // Se resta 1 a basePixelSize para dejar ver la cuadrícula (línea de separación)
          for (let y = 0; y < pixelHeight; y++) {
            for (let x = 0; x < pixelWidth; x++) {
              const pixelData = sourceCtx.getImageData(x, y, 1, 1).data;
              outputCtx.fillStyle = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
              outputCtx.fillRect(
                x * basePixelSize,
                y * basePixelSize,
                basePixelSize - 1,
                basePixelSize - 1
              );

              // Dibujar la cuadrícula
              outputCtx.strokeStyle = 'black';
              outputCtx.lineWidth = 1;
              outputCtx.strokeRect(
                x * basePixelSize + 0.5,
                y * basePixelSize + 0.5,
                basePixelSize - 1,
                basePixelSize - 1
              );
            }
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile, pixelWidth, pixelHeight, basePixelSize]);

  // Funciones para dibujar y borrar utilizando basePixelSize
  const drawSquare = (ctx, x, y, color, size = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(
      x * basePixelSize,
      y * basePixelSize,
      basePixelSize * size - 1,
      basePixelSize * size - 1
    );
  };

  const clearSquare = (ctx, x, y, size = 1) => {
    ctx.clearRect(
      x * basePixelSize,
      y * basePixelSize,
      basePixelSize * size - 1,
      basePixelSize * size - 1
    );
  };

  // Convierte las coordenadas de pantalla a coordenadas de la grilla
  const getCanvasCoordinates = (clientX, clientY) => {
    const rect = outputCanvasRef.current.getBoundingClientRect();
    const scaleX = outputCanvasRef.current.width / rect.width;
    const scaleY = outputCanvasRef.current.height / rect.height;
    const x = Math.floor(((clientX - rect.left) * scaleX) / basePixelSize);
    const y = Math.floor(((clientY - rect.top) * scaleY) / basePixelSize);
    return { x, y };
  };

  // Manejo de eventos del mouse
  const handleMouseDown = (e) => {
    if (e.ctrlKey) {
      // Inicia el pan (arrastre) si se mantiene la tecla Ctrl
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
      // Si se mantiene presionado el botón del mouse, continúa pintando o borrando
      handleCanvasClick(e);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Función para procesar el clic (o arrastre) sobre el canvas
  const handleCanvasClick = (e) => {
    if (e.ctrlKey || isPanning) return;

    const { x: gridX, y: gridY } = getCanvasCoordinates(e.clientX, e.clientY);
    const ctx = outputCanvasRef.current.getContext('2d');

    // Recorre la cantidad de píxeles según el tamaño del pincel
    for (let i = 0; i < brushSize; i++) {
      for (let j = 0; j < brushSize; j++) {
        const px = gridX + i;
        const py = gridY + j;

        if (tool === 'eraser') {
          clearSquare(ctx, px, py);
        } else if (tool === 'brush') {
          drawSquare(ctx, px, py, selectedColor);
        }

        // Redibujar la cuadrícula en el área modificada
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          px * basePixelSize + 0.5,
          py * basePixelSize + 0.5,
          basePixelSize - 1,
          basePixelSize - 1
        );
      }
    }
  };

  // Soporte para eventos táctiles
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleCanvasClick({ clientX: touch.clientX, clientY: touch.clientY, ctrlKey: e.ctrlKey });
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length) {
      const touch = e.touches[0];
      handleCanvasClick({ clientX: touch.clientX, clientY: touch.clientY, ctrlKey: e.ctrlKey });
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsPanning(false);
  };

  return (
    <div>
      {/* Controles para seleccionar herramienta y tamaño del pincel */}
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          userSelect: 'none'
        }}
      >
        {/* Canvas oculto para el procesamiento de la imagen fuente */}
        <canvas ref={sourceCanvasRef} style={{ display: 'none' }}></canvas>

        {/* Canvas de salida con la imagen pixelada y la cuadrícula */}
        <canvas
          ref={outputCanvasRef}
          id="output-canvas"
          style={{
            width: `${pixelWidth * basePixelSize}px`,
            height: `${pixelHeight * basePixelSize}px`,
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: 'top left',
            border: '1px solid #ccc',
            imageRendering: 'pixelated'
          }}
        ></canvas>
      </div>
    </div>
  );
}

export default Rejilla;
