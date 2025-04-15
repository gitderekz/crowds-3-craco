import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { api, publicApi, getRefreshToken, setupTokenRefresh } from '../services/authService';

const SponsorRow = ({loadedSponsorPhotos}) => {
  const [sponsorPhotos, setSponsorPhotos] = useState([]);

  useEffect(()=>{
    setSponsorPhotos(loadedSponsorPhotos);
  })
  // useEffect(() => {
  //   const fetchSponsorPhotos = async () => {
  //     try {
  //       // const response = await axios.get(`${process.env.REACT_APP_API_URL}/photos/sponsor`);
  //       const response = await api.get(`/photos/sponsor`);
  //       setSponsorPhotos(response.data);
  //     } catch (error) {
  //       console.error('Error fetching sponsor photos:', error);
  //     }
  //   };
  //   fetchSponsorPhotos();
  // }, []);

  return (
    <div className="sponsor-row">
      {sponsorPhotos.map((photo) => (
        <img
          key={photo.id}
          src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${photo.imageUrl}`}
          alt={photo.name}
        />
      ))}
    </div>
  );
};

export default SponsorRow;