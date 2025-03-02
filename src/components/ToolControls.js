// components/ToolControls.js
import React from 'react';

const ToolControls = ({
  tool,
  setTool,
  brushSize,
  setBrushSize,
  brushShape,
  setBrushShape,
  isMobile
}) => {
  // Layout: horizontal en móviles, vertical en desktop
  const containerStyle = isMobile
    ? {
        display: 'flex',
        flexDirection: 'row',
        gap: '10px',
        alignItems: 'center',
        justifyContent: 'center'
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      };

  return (
    <div className="tool-controls" style={containerStyle}>
      {/* Grupo de herramientas básicas: pincel, línea, borrador */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={() => setTool('brush')}
          className="tooltip-button"
          data-tooltip="Pincel"
          style={{
            background: tool === 'brush' ? '#ad4500' : '#ff6600',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <svg
            style={{ color: 'white' }}
            className="w-6 h-6"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10.779 17.779L4.36 19.918L6.5 13.5m4.279 4.279l8.364-8.643a3.027 3.027 0 0 0-2.14-5.165 3.03 3.03 0 0 0-2.14.886L6.5 13.5m4.279 4.279L6.499 13.5m2.14 2.14l6.213-6.504M12.75 7.04L17 11.28"
            />
          </svg>
        </button>
        <button
          onClick={() => setTool('line')}
          className="tooltip-button"
          data-tooltip="Línea"
          style={{
            background: tool === 'line' ? '#ad4500' : '#ff6600',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <svg
            style={{ color: 'white' }}
            className="w-6 h-6"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 7H7m2 3H7m2 3H7m4 2v2m3-2v2m3-2v2M4 5v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-9a1 1 0 0 1-1-1V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1Z"
            />
          </svg>
        </button>
        <button
          onClick={() => setTool('eraser')}
          className="tooltip-button"
          data-tooltip="Borrador"
          style={{
            background: tool === 'eraser' ? '#ad4500' : '#ff6600',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <svg
            style={{ color: 'white' }}
            className="w-6 h-6"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
            />
          </svg>
        </button>
      </div>

      {/* Grupo para herramientas de formas: rectángulo y elipse */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={() => setTool('rectangle')}
          className="tooltip-button"
          data-tooltip="Rectángulo"
          style={{
            background: tool === 'rectangle' ? '#ad4500' : '#ff6600',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <svg
            style={{ color: 'white' }}
            className="w-6 h-6"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
        <button
          onClick={() => setTool('ellipse')}
          className="tooltip-button"
          data-tooltip="Elipse"
          style={{
            background: tool === 'ellipse' ? '#ad4500' : '#ff6600',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <svg
            style={{ color: 'white' }}
            className="w-6 h-6"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <ellipse cx="12" cy="12" rx="8" ry="5" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
      </div>

      {/* Grupo de selectores para el pincel (tamaño y forma) */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          {[1, 2, 3, 4, 5].map((size) => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              className="tooltip-button"
              data-tooltip={`${size}x${size}`}
              style={{
                width: `${15 + size * 3}px`,
                height: `${15 + size * 3}px`,
                background: brushSize === size ? '#ad4500' : '#ff6600',
                border: brushSize === size ? '1px solid orange' : '1px solid #ccc',
                padding: 0,
                margin: 0,
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            ></button>
          ))}
        </div>
        <button
          onClick={() => setBrushShape(brushShape === 'circle' ? 'square' : 'circle')}
          className="tooltip-button"
          data-tooltip={brushShape === 'circle' ? 'Cuadrado' : 'Círculo'}
          style={{
            width: '40px',
            height: '40px',
            background: '#ff6600',
            border: '1px solid #ccc',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              background: 'white',
              borderRadius: brushShape === 'circle' ? '50%' : '0'
            }}
          ></div>
        </button>
      </div>
    </div>
  );
};

export default ToolControls;
