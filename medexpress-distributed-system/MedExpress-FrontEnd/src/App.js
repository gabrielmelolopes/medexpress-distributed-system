import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './CartContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Produto from './pages/Produto';
import Checkout from './pages/Checkout';
import Rastreamento from './pages/Rastreamento';
import Admin from './pages/Admin';
import './shared.css';

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/login"        element={<Login />} />
          <Route path="/produto"      element={<Produto />} />
          <Route path="/checkout"     element={<Checkout />} />
          <Route path="/rastreamento" element={<Rastreamento />} />
          <Route path="/admin"        element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
