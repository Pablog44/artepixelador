import React from 'react';

function ToolControls({ tool, setTool, brushSize, setBrushSize }) {
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
        </div>
    );
}

export default ToolControls;
