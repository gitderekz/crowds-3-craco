import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Upload = ({fetchPhotos,fetchSponsorPhotos}) => {
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

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/users`,{
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`, // Add token to request headers
          }
        });
        setClients(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/categories`);
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get userId from localStorage
    const userId = localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.id:null;
    if (!userId) {
      setError('User not logged in');
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    formData.append('mediaType', mediaType);
    formData.append('name', name);
    formData.append('category', category);
    // formData.append('clientId', client);
    if (client) {
      formData.append('clientId', client);
    }
    formData.append('event', event);
    formData.append('displayOnHome', displayOnHome);
    formData.append('userId', userId);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/photos/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      alert('Photos uploaded successfully');
      fetchPhotos();
      fetchSponsorPhotos();
    } catch (error) {
      setError('Error uploading photos');
    }
  };

  return (
    <div className="upload">
      <h1>Upload Photos</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="file" multiple onChange={(e) => setFiles([...e.target.files])} required />
        <select value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
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
        />
        {/* <select value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <optgroup key={cat.id} label={cat.name}>
              {cat.children?.map((subCat) => (
                <option key={subCat.id} value={subCat.name}>
                  {subCat.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select> */}
        <select value={client} onChange={(e) => setClient(e.target.value)} >
          <option value="">-Select Client-</option>
          {clients.map((client) => (
            <option className='bold-text' key={client.id} value={client.id}>{client.username}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="">-Select Category-</option>
          {categories.map((cat) => (
            <React.Fragment key={cat.id}>
              {/* Render parent category as an option */}
              <option className='bold-text' value={cat.id}>{cat.name}</option>
              {/* Render child categories if they exist */}
              {cat.children?.map((subCat) => (
                <option key={subCat.id} value={subCat.id}>
                  &nbsp;&nbsp;{subCat.name} {/* Indent child categories for better readability */}
                </option>
              ))}
            </React.Fragment>
          ))}
        </select>
        <select value={event} onChange={(e) => setEvent(e.target.value)}>
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
          />
        </label>
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default Upload;