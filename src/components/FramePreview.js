// components/FramePreview.js
import React from 'react';

const FramePreview = ({ frames, selectedFrameIndex, setSelectedFrameIndex }) => {
  return (
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
  );
};

export default FramePreview;
