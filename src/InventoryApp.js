import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Download, Star, X } from 'lucide-react';
import { supabase } from './supabaseClient';
import { compressImage } from './utils/imageCompressor';

// Helper component for confirmation dialogs
const ConfirmationDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-3 z-[2000]">
    <div className="bg-[#1e1e2e] rounded-lg p-4 w-full max-w-xs shadow-2xl border border-white/10 animate-pop">
      <h3 className="text-lg font-bold mb-3 text-pink-400">Confirmación</h3>
      <p className="text-white/80 text-sm">{message}</p>
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <button
          onClick={onConfirm}
          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-200 shadow-lg flex items-center justify-center gap-1 text-sm"
        >
          <Trash2 size={14} /> Confirmar
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition duration-200 border border-white/20 text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
);

const InventoryApp = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null); // Stores ID of product to delete
  const [formData, setFormData] = useState({
    name: '',
    preciopublico: '',
    costoproveedor: '',
    cantidad: '',
    sistemamedida: 'unidad',
    fotoproducto: '',
    fotocodigobarras: '',
    procedencia: 'Estrellita'
  });

  // Load products from Supabase on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      // Initialize with dummy data if there's an error
      setProducts([
        {
          id: 1, name: 'Arroz Blanco 1kg', preciopublico: 25.50, costoproveedor: 18.75, cantidad: 50, sistemamedida: 'unidad',
          fotoproducto: 'https://placehold.co/300x200/8b5cf6/ffffff?text=Arroz+Blanco', fotocodigobarras: 'https://placehold.co/300x100/4c1d95/ffffff?text=CDB+1234', procedencia: 'Estrellita'
        },
        {
          id: 2, name: 'Aceite de Oliva 500ml', preciopublico: 89.90, costoproveedor: 65.40, cantidad: 25, sistemamedida: 'botella',
          fotoproducto: 'https://placehold.co/300x200/ec4899/ffffff?text=Aceite+Oliva', fotocodigobarras: 'https://placehold.co/300x100/701a75/ffffff?text=CDB+5678', procedencia: '2Estrellas'
        },
        {
          id: 3, name: 'Leche Entera 1L', preciopublico: 18.50, costoproveedor: 12.80, cantidad: 100, sistemamedida: 'litro',
          fotoproducto: 'https://placehold.co/300x200/06b6d4/ffffff?text=Leche+Entera', fotocodigobarras: 'https://placehold.co/300x100/083344/ffffff?text=CDB+9012', procedencia: 'Bodega'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // --- MODIFIED: Handle file input and Base64 conversion with compression ---
  const handleInputChange = async (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file' && files && files.length > 0) {
      const file = files[0];
      
      // Only process image files
      if (file.type.startsWith('image/')) {
        try {
          // Compress the image
          const compressedImage = await compressImage(file, 800, 600, 0.7);
          
          // Update form data with compressed image
          setFormData(prev => ({
            ...prev,
            [name]: compressedImage // Store compressed Base64 string (data URL)
          }));
        } catch (error) {
          console.error("Error compressing image:", error);
          // Fallback to original method if compression fails
          const reader = new FileReader();
          reader.onloadend = () => {
            setFormData(prev => ({
              ...prev,
              [name]: reader.result // Store Base64 string (data URL)
            }));
          };
          reader.readAsDataURL(file);
        }
      } else {
        // Handle non-image files (if any)
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            [name]: reader.result // Store Base64 string (data URL)
          }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      // Handle standard text/number inputs
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  // --------------------------------------------------------

  const handleModalClose = () => {
    setShowModal(false);
    setEditingProduct(null);
    // Reset form data on close
    setFormData({
      name: '',
      preciopublico: '',
      costoproveedor: '',
      cantidad: '',
      sistemamedida: 'unidad',
      fotoproducto: '',
      fotocodigobarras: '',
      procedencia: 'Estrellita'
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    const { name, preciopublico, costoproveedor, cantidad } = formData;
    if (!name || isNaN(parseFloat(preciopublico)) || isNaN(parseFloat(costoproveedor)) || isNaN(parseInt(cantidad))) {
      console.error("Formulario incompleto o con valores inválidos.");
      return; // Stop submission if validation fails
    }

    const newProductData = {
      ...formData,
      preciopublico: parseFloat(preciopublico),
      costoproveedor: parseFloat(costoproveedor),
      cantidad: parseInt(cantidad)
    };

    try {
      let result;
      if (editingProduct) {
        // Update existing product
        result = await supabase
          .from('products')
          .update(newProductData)
          .eq('id', editingProduct.id);
        
        if (result.error) throw result.error;
      } else {
        // Insert new product
        result = await supabase
          .from('products')
          .insert([newProductData]);
        
        if (result.error) throw result.error;
      }
      
      // Refresh product list
      await fetchProducts();
      handleModalClose();
    } catch (error) {
      console.error("Error al guardar producto:", error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      preciopublico: product.preciopublico.toString(),
      costoproveedor: product.costoproveedor.toString(),
      cantidad: product.cantidad.toString(),
      sistemamedida: product.sistemamedida,
      // Load Base64 string or URL
      fotoproducto: product.fotoproducto, 
      fotocodigobarras: product.fotocodigobarras,
      procedencia: product.procedencia
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setShowConfirm(id);
  };

  const confirmDelete = async () => {
    if (showConfirm) {
      try {
        const result = await supabase
          .from('products')
          .delete()
          .eq('id', showConfirm);
        
        if (result.error) throw result.error;
        
        // Refresh product list
        await fetchProducts();
        setShowConfirm(null);
      } catch (error) {
        console.error("Error al eliminar producto:", error);
      }
    }
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      preciopublico: '',
      costoproveedor: '',
      cantidad: '',
      sistemamedida: 'unidad',
      fotoproducto: 'https://placehold.co/300x200/555555/ffffff?text=Producto', // Default placeholder URL
      fotocodigobarras: 'https://placehold.co/300x100/333333/ffffff?text=CDB', // Default placeholder URL
      procedencia: 'Estrellita'
    });
    setShowModal(true);
  };

  const exportData = (format) => {
    if (products.length === 0) return;

    if (format === 'csv') {
      const headers = ['Nombre', 'Precio Público', 'Costo Proveedor', 'Cantidad', 'Sistema Medida', 'Procedencia'];
      const csvContent = [
        headers.join(','),
        ...products.map(p => [
          `"${p.name.replace(/"/g, '""')}"`, // Handle quotes in names
          p.preciopublico.toFixed(2),
          p.costoproveedor.toFixed(2),
          p.cantidad,
          p.sistemamedida,
          p.procedencia
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'inventario_abarrotes.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'json') {
      const dataStr = JSON.stringify(products, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = 'inventario_abarrotes.json';
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const getStarRating = (procedencia) => {
    const ratingMap = {
      'Estrellita': 1,
      '2Estrellas': 2,
      'Bodega': 3,
    };
    const rating = ratingMap[procedencia] || 0;
    
    return (
      <div className="inline-flex items-center gap-0.5">
        {[...Array(3)].map((_, i) => 
          i < rating ? <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" /> : <Star key={i} size={16} className="text-white/30" />
        )}
      </div>
    );
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-5 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto"></div>
          <p className="mt-4 text-sm sm:text-base">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-3 sm:p-5 text-white">
      {/* Header Section */}
      <div className="bg-[#1e1e2e] bg-opacity-95 backdrop-blur-md rounded-xl p-4 mb-4 shadow-2xl border border-white/10 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">
            Inventario de Abarrotes
          </h1>
        </div>
        
        {/* Search */}
        <div className="relative w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 pl-9 pr-3 border border-white/20 rounded-full text-sm bg-white/10 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition duration-300"
          />
        </div>

        {/* Button Group - Stack on mobile, row on larger screens */}
        <div className="flex flex-wrap gap-2 justify-center w-full">
          <button
            onClick={() => exportData('csv')}
            className="flex items-center gap-1 sm:gap-2 px-3 py-2 text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition duration-200 border border-white/20 min-w-[120px]"
          >
            <Download size={16} className="min-w-[16px]" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => exportData('json')}
            className="flex items-center gap-1 sm:gap-2 px-3 py-2 text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition duration-200 border border-white/20 min-w-[120px]"
          >
            <Download size={16} className="min-w-[16px]" />
            <span>JSON</span>
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1 sm:gap-2 px-3 py-2 text-xs sm:text-sm bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-500 text-white font-bold rounded-full transition duration-200 shadow-lg shadow-violet-500/30 min-w-[130px]"
          >
            <Plus size={16} className="min-w-[16px]" />
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-[#1e1e2e] bg-opacity-95 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-white/10 min-h-[300px]">
        {filteredProducts.length === 0 ? (
          <div className="text-center p-6 text-white/60">
            <div className="text-4xl mb-3 opacity-70">📦</div>
            <h3 className="text-lg sm:text-xl font-semibold">No hay productos registrados</h3>
            <p className="mt-2 text-sm">{searchTerm ? 'No se encontraron productos que coincidan con tu búsqueda' : 'Agrega tu primer producto para comenzar.'}</p>
            {!searchTerm && (
              <button
                onClick={handleAddNew}
                className="mt-4 flex items-center gap-1 sm:gap-2 mx-auto px-4 py-2 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-500 text-white font-bold rounded-full transition duration-200 shadow-lg shadow-violet-500/30 text-sm"
              >
                <Plus size={16} />
                Agregar Producto
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white/5 rounded-lg p-3 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/20 hover:bg-white/10 border border-white/10">
                <img
                  src={product.fotoproducto}
                  alt={product.name}
                  className="w-full h-24 object-cover rounded-lg mb-3 bg-white/10 border border-white/10"
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = `https://placehold.co/300x200/94a3b8/ffffff?text=${encodeURIComponent(product.name.substring(0, 10))}`;
                  }}
                />
                <h3 className="text-base font-semibold text-white truncate">{product.name}</h3>
                
                <div className="mt-2 space-y-0.5 text-xs sm:text-sm text-white/80">
                  <p><strong>P. Público:</strong> <span className="text-violet-400 font-bold">${product.preciopublico.toFixed(2)}</span></p>
                  <p><strong>Costo Prov.:</strong> ${product.costoproveedor.toFixed(2)}</p>
                  <p><strong>Ganancia:</strong> <span className="text-emerald-400 font-medium">${(product.preciopublico - product.costoproveedor).toFixed(2)}</span></p>
                  <p><strong>Cant.:</strong> {product.cantidad} {product.sistemamedida}</p>
                  <div className="flex items-center gap-1">
                    <strong>Procedencia:</strong> {getStarRating(product.procedencia)}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 px-2 py-1.5 text-xs sm:text-sm text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 rounded-lg transition duration-200 flex items-center justify-center gap-0.5 text-center"
                  >
                    <Edit size={14} />
                    <span>E</span>
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 px-2 py-1.5 text-xs sm:text-sm text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition duration-200 flex items-center justify-center gap-0.5 text-center"
                  >
                    <Trash2 size={14} />
                    <span>D</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Modal (Add/Edit) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-[#1e1e2e] rounded-lg sm:rounded-xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md shadow-2xl border border-white/10 relative my-4 animate-pop max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={handleModalClose} className="text-white/60 hover:text-white transition duration-200 p-1 rounded-full hover:bg-white/10">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
              {/* Nombre del Producto */}
              <div className="space-y-1">
                <label className="text-white font-medium text-sm">Nombre del Producto</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 sm:p-3 border border-white/20 rounded-lg text-sm bg-white/10 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition duration-200"
                />
              </div>

              {/* Precio Público */}
              <div className="space-y-1">
                <label className="text-white font-medium text-sm">Precio Público ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="preciopublico"
                  value={formData.preciopublico}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 sm:p-3 border border-white/20 rounded-lg text-sm bg-white/10 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition duration-200"
                />
              </div>

              {/* Costo al Proveedor */}
              <div className="space-y-1">
                <label className="text-white font-medium text-sm">Costo al que me lo dan ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="costoproveedor"
                  value={formData.costoproveedor}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 sm:p-3 border border-white/20 rounded-lg text-sm bg-white/10 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition duration-200"
                />
              </div>

              {/* Cantidad */}
              <div className="space-y-1">
                <label className="text-white font-medium text-sm">Cantidad</label>
                <input
                  type="number"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 sm:p-3 border border-white/20 rounded-lg text-sm bg-white/10 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition duration-200"
                />
              </div>

              {/* Sistema de Medida */}
              <div className="space-y-1">
                <label className="text-white font-medium text-sm">Sistema de Medida</label>
                <select
                  name="sistemamedida"
                  value={formData.sistemamedida}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 sm:p-3 border border-white/20 rounded-lg text-sm bg-white/10 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition duration-200 appearance-none bg-right-8 bg-no-repeat"
                  style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`, backgroundSize: '1em', backgroundPosition: 'right 12px center'}}
                >
                  <option value="unidad">Unidad</option>
                  <option value="kilogramo">Kilogramo</option>
                  <option value="litro">Litro</option>
                  <option value="metro">Metro</option>
                  <option value="paquete">Paquete</option>
                  <option value="caja">Caja</option>
                  <option value="botella">Botella</option>
                </select>
              </div>

              {/* Procedencia */}
              <div className="space-y-1">
                <label className="text-white font-medium text-sm">Procedencia (Calidad)</label>
                <select
                  name="procedencia"
                  value={formData.procedencia}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 sm:p-3 border border-white/20 rounded-lg text-sm bg-white/10 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition duration-200 appearance-none bg-right-8 bg-no-repeat"
                  style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`, backgroundSize: '1em', backgroundPosition: 'right 12px center'}}
                >
                  <option value="Estrellita">Estrellita (⭐)</option>
                  <option value="2Estrellas">2 Estrellas (⭐⭐)</option>
                  <option value="Bodega">Bodega (⭐⭐⭐)</option>
                </select>
              </div>

              {/* --- MODIFIED: Foto Producto Input (Use Camera/File) --- */}
              <div className="space-y-1">
                <label className="text-white font-medium text-sm">Foto del Producto (Cámara/Archivo)</label>
                {/* Image Preview */}
                {formData.fotoproducto && (
                  <div className="mb-2">
                    <img 
                      src={formData.fotoproducto} 
                      alt="Previsualización del Producto" 
                      className="w-full h-20 object-contain rounded-lg border border-white/20 bg-white/10 p-1" 
                    />
                  </div>
                )}
                <input
                  type="file" // Changed from url to file
                  accept="image/*" // Accept only image files
                  capture="environment" // Request rear camera on mobile
                  name="fotoproducto"
                  // NOTE: Cannot set value for type="file" inputs
                  onChange={handleInputChange}
                  className="w-full p-2 text-xs border border-white/20 rounded-lg bg-white/10 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-500/80 file:text-white hover:file:bg-violet-600/90 transition duration-200"
                />
              </div>
              {/* -------------------------------------------------------- */}

              {/* --- MODIFIED: Foto Código de Barras Input (Use Camera/File) --- */}
              <div className="space-y-1">
                <label className="text-white font-medium text-sm">Foto del Código de Barras (Cámara/Archivo)</label>
                 {/* Image Preview */}
                {formData.fotocodigobarras && (
                  <div className="mb-2">
                    <img 
                      src={formData.fotocodigobarras} 
                      alt="Previsualización del Código de Barras" 
                      className="w-full h-16 object-contain rounded-lg border border-white/20 bg-white/10 p-1" 
                    />
                  </div>
                )}
                <input
                  type="file" // Changed from url to file
                  accept="image/*" // Accept only image files
                  capture="environment" // Request rear camera on mobile
                  name="fotocodigobarras"
                  // NOTE: Cannot set value for type="file" inputs
                  onChange={handleInputChange}
                  className="w-full p-2 text-xs border border-white/20 rounded-lg bg-white/10 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-500/80 file:text-white hover:file:bg-violet-600/90 transition duration-200"
                />
              </div>
              {/* -------------------------------------------------------- */}

              <button
                type="submit"
                className="mt-3 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-500 text-white font-bold rounded-lg transition duration-200 text-base shadow-md shadow-violet-500/30"
              >
                {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <ConfirmationDialog
          message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirm(null)}
        />
      )}
    </div>
  );
};

export default InventoryApp;