import React, { useState, useEffect } from 'react';
import { api } from '../services/authService';

const Upload = ({ fetchPhotos, fetchSponsorPhotos }) => {
  const [files, setFiles] = useState([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [client, setClient] = useState(null);
  const [event, setEvent] = useState('none');
  const [mediaType, setMediaType] = useState('image');
  const [displayOnHome, setDisplayOnHome] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.get('/users');
        setClients(response.data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userId = user?.id;
    
    if (!userId) {
      setError('User not logged in');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    formData.append('mediaType', mediaType);
    formData.append('name', name);
    formData.append('categoryId', category);
    if (client) formData.append('clientId', client);
    formData.append('event', event);
    formData.append('displayOnHome', displayOnHome);
    formData.append('userId', userId);

    try {
      await api.post('/photos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Photos uploaded successfully');
      fetchPhotos();
      fetchSponsorPhotos();
      // Reset form
      setFiles([]);
      setName('');
      setCategory('');
      setClient(null);
      setEvent('none');
      setMediaType('image');
      setDisplayOnHome(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Error uploading photos');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload">
      <h1>Upload Photos</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="file" multiple onChange={(e) => setFiles([...e.target.files])} required disabled={uploading} />
        <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} disabled={uploading}>
          <option value="image">Image</option>
          <option value="gif">GIF</option>
          <option value="video">Video</option>
        </select>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={uploading}
        />
        <select value={client} onChange={(e) => setClient(e.target.value)} disabled={uploading}>
          <option value="">-Select Client-</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>{client.username}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} required disabled={uploading}>
          <option value="">-Select Category-</option>
          {categories.map((cat) => (
            <React.Fragment key={cat.id}>
              <option className='bold-text' value={cat.id}>{cat.name}</option>
              {cat.children?.map((subCat) => (
                <option key={subCat.id} value={subCat.id}>
                  &nbsp;&nbsp;{subCat.name}
                </option>
              ))}
            </React.Fragment>
          ))}
        </select>
        <select value={event} onChange={(e) => setEvent(e.target.value)} disabled={uploading}>
          <option value="none">Event (None)</option>
          <option value="tour">Tour</option>
          <option value="birthday">Birthday</option>
          <option value="wedding">Wedding</option>
          <option value="party">Party</option>
        </select>
        <label>
          Display on Home:
          <input
            type="checkbox"
            checked={displayOnHome}
            onChange={(e) => setDisplayOnHome(e.target.checked)}
            disabled={uploading}
          />
        </label>
        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  );
};

export default Upload;