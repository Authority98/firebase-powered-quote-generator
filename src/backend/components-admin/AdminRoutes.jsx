import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayoutAdmin from './AdminLayoutAdmin';
import ProductsAdmin from '../pages-admin/ProductsAdmin';
import TypesAdmin from '../pages-admin/TypesAdmin';
import ExtrasAdmin from '../pages-admin/ExtrasAdmin';
import DesignAdmin from '../pages-admin/DesignAdmin';
import LeadsAdmin from '../pages-admin/LeadsAdmin';
import '../styles/admin-styles.css';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLayoutAdmin />}>
        <Route index element={<Navigate to="products" replace />} />
        <Route path="products" element={<ProductsAdmin />} />
        <Route path="types" element={<TypesAdmin />} />
        <Route path="extras" element={<ExtrasAdmin />} />
        <Route path="design" element={<DesignAdmin />} />
        <Route path="leads" element={<LeadsAdmin />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;