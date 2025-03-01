// components/MovementControls.js
import React from 'react';

const MovementControls = ({ handleMove }) => {
  const buttonStyle = { margin: '0 8px' };

  return (
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
  );
};

export default MovementControls;
