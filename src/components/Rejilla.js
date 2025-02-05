import React, { useEffect, useRef, useState, useCallback } from 'react';

function Rejilla({ 
  imageFile, 
  frameData, 
  pixelWidth, 
  pixelHeight, 
  selectedColor, 
  scale, 
  position, 
  setPosition,
  tool,
  brushSize,
  brushShape
}) {
  const sourceCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  
  // Estado para manejar el panning (arrastre) del canvas
  const [isPanning, setIsPanning] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  
  // Calcula el tamaño base de cada “píxel” para que el canvas ocupe aproximadamente el 90% de la ventana.
  const basePixelSize = Math.floor(
    Math.min(
      (window.innerWidth * 0.9) / pixelWidth,
      (window.innerHeight * 0.9) / pixelHeight
    )
  );
  
  // Envolvemos drawPixel en useCallback para poder incluirlo en el array de dependencias
  const drawPixel = useCallback((ctx, x, y, color, size = 1, shape = 'square') => {
    ctx.fillStyle = color;
    if (shape === 'circle') {
      ctx.beginPath();
      const centerX = x * basePixelSize + (basePixelSize * size) / 2;
      const centerY = y * basePixelSize + (basePixelSize * size) / 2;
      const radius = (basePixelSize * size) / 2;
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillRect(
        x * basePixelSize,
        y * basePixelSize,
        basePixelSize * size - 1,
        basePixelSize * size - 1
      );
    }
  }, [basePixelSize]);
  
  // Función para borrar un “píxel” con soporte para forma
  const clearPixel = (ctx, x, y, size = 1, shape = 'square') => {
    if (shape === 'circle') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      const centerX = x * basePixelSize + (basePixelSize * size) / 2;
      const centerY = y * basePixelSize + (basePixelSize * size) / 2;
      const radius = (basePixelSize * size) / 2;
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.clearRect(
        x * basePixelSize,
        y * basePixelSize,
        basePixelSize * size - 1,
        basePixelSize * size - 1
      );
    }
  };
  
  // Convierte las coordenadas de pantalla a coordenadas de la grilla.
  const getCanvasCoordinates = (clientX, clientY) => {
    const rect = outputCanvasRef.current.getBoundingClientRect();
    const scaleX = outputCanvasRef.current.width / rect.width;
    const scaleY = outputCanvasRef.current.height / rect.height;
    const x = Math.floor(((clientX - rect.left) * scaleX) / basePixelSize);
    const y = Math.floor(((clientY - rect.top) * scaleY) / basePixelSize);
    return { x, y };
  };
  
  // Efecto para cargar la imagen base: si existe frameData se carga ese frame,
  // de lo contrario se usa imageFile.
  useEffect(() => {
    const sourceCanvas = sourceCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    const sourceCtx = sourceCanvas.getContext('2d');
    const outputCtx = outputCanvas.getContext('2d');
    outputCtx.imageSmoothingEnabled = false;
    
    if (frameData) {
      // Si se está editando un frame guardado, se asume que ya es una imagen pixelada.
      sourceCanvas.width = pixelWidth * basePixelSize;
      sourceCanvas.height = pixelHeight * basePixelSize;
      outputCanvas.width = pixelWidth * basePixelSize;
      outputCanvas.height = pixelHeight * basePixelSize;
      outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
  
      const img = new Image();
      img.onload = () => {
        outputCtx.drawImage(img, 0, 0, outputCanvas.width, outputCanvas.height);
        // Dibujar la cuadrícula sobre la imagen.
        for (let y = 0; y < pixelHeight; y++) {
          for (let x = 0; x < pixelWidth; x++) {
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
      img.src = frameData;
    } else if (imageFile) {
      // Al cargar una imagen se crea el efecto pixelado.
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = () => {
          // Canvas fuente: se reduce la imagen a la resolución de la grilla.
          sourceCanvas.width = pixelWidth;
          sourceCanvas.height = pixelHeight;
          // Canvas de salida: se escala para ocupar el área de trabajo.
          outputCanvas.width = pixelWidth * basePixelSize;
          outputCanvas.height = pixelHeight * basePixelSize;
          sourceCtx.imageSmoothingEnabled = false;
          outputCtx.imageSmoothingEnabled = false;
          sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
          outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
  
          // Se dibuja la imagen reducida en el canvas fuente.
          sourceCtx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
  
          // Recorremos cada “píxel” y lo dibujamos ampliado en el canvas de salida.
          for (let y = 0; y < pixelHeight; y++) {
            for (let x = 0; x < pixelWidth; x++) {
              const pixelData = sourceCtx.getImageData(x, y, 1, 1).data;
              const color = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
              drawPixel(outputCtx, x, y, color, 1, brushShape);
              // Dibujar la cuadrícula.
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
  }, [imageFile, frameData, pixelWidth, pixelHeight, basePixelSize, brushShape, drawPixel]);
  
  // Función que procesa el clic (o arrastre) sobre el canvas para pintar o borrar.
  const handleCanvasClick = (e) => {
    if (e.ctrlKey || isPanning) return;
    const { x: gridX, y: gridY } = getCanvasCoordinates(e.clientX, e.clientY);
    const ctx = outputCanvasRef.current.getContext('2d');
  
    for (let i = 0; i < brushSize; i++) {
      for (let j = 0; j < brushSize; j++) {
        const px = gridX + i;
        const py = gridY + j;
  
        if (tool === 'eraser') {
          clearPixel(ctx, px, py, 1, brushShape);
        } else if (tool === 'brush') {
          drawPixel(ctx, px, py, selectedColor, 1, brushShape);
        }
  
        // Redibuja la cuadrícula en el área modificada.
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
  
  // Eventos del mouse y táctiles para panning y dibujo.
  const handleMouseDown = (e) => {
    if (e.ctrlKey) {
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
      handleCanvasClick(e);
    }
  };
  
  const handleMouseUp = () => {
    setIsPanning(false);
  };
  
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
      {/* El componente no muestra controles internos de herramienta */}
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
        {/* Canvas oculto para procesar la imagen fuente */}
        <canvas ref={sourceCanvasRef} style={{ display: 'none' }}></canvas>
        {/* 
          Se añade "key" al canvas para forzar su re-montaje cuando cambie frameData o imageFile.
          Así, al seleccionar un frame nuevo, se reinicializa el canvas con la imagen correspondiente.
        */}
        <canvas
          ref={outputCanvasRef}
          key={frameData || imageFile}
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
