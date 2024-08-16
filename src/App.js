import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Controls from './components/Controls';

function App() {
    return (
        <Router basename="/artepixelador">
            <div className="App">
                <Routes>
                    {/* Página principal con PixelatedImage */}
                    <Route path="/" element={<Controls page="default" />} />

                    {/* Página de rejilla */}
                    <Route path="/rejilla" element={<Controls page="rejilla" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
