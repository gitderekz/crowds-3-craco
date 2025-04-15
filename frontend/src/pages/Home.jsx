import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PhotoGrid from '../components/PhotoGrid';
import Header from '../components/Header';

// const Home = () => {
//   const [homePhotos, setHomePhotos] = useState([]);

//   useEffect(() => {
//     const fetchHomePhotos = async () => {
//       try {
//         const response = await axios.get(`${process.env.REACT_APP_API_URL}/photos/home`);
//         setHomePhotos(response.data);
//       } catch (error) {
//         console.error('Error fetching home photos:', error);
//       }
//     };
//     fetchHomePhotos();
//   }, []);

//   return (
//     <div className="home">
//       <h1>Welcome to Crowds</h1>
//       <PhotoGrid photos={homePhotos} />
//     </div>
//   );
// };

const Home = ({ photos }) => {
  // const [photos, setPhotos] = useState([]);
  // const [searchQuery, setSearchQuery] = useState('');

  // useEffect(() => {
  //   const fetchPhotos = async () => {
  //     try {
  //       const response = await axios.get(`${process.env.REACT_APP_API_URL}/photos/home`);
  //       setPhotos(response.data);
  //     } catch (error) {
  //       console.error('Error fetching photos:', error);
  //     }
  //   };
  //   fetchPhotos();
  // }, []);

  // const handleSearch = (query) => {
  //   setSearchQuery(query);
  // };

  // // Filter photos based on the search query
  // const filteredPhotos = photos.filter((photo) =>
  //   photo.name.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  return (
    <div className="home">
      {/* <Header onSearch={handleSearch} /> */}
      <h1>Welcome to Crowds</h1>
      <PhotoGrid photos={photos} />
    </div>
  );
};

export default Home;