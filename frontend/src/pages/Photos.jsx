// import React, { useState, useContext, useEffect } from 'react';
// import axios from 'axios';
// import { ThemeContext } from '../App';
// import { useSearchParams } from 'react-router-dom';
// import PhotoGrid from '../components/PhotoGrid';
// import Header from '../components/Header';
// import { FaForward, FaPlay } from 'react-icons/fa';

// const Photos = ({ filteredPhotos, isSearching }) => {
//   const { theme } = useContext(ThemeContext);
//   const [searchParams] = useSearchParams();
//   const category = searchParams.get('category');
//   const [photos, setPhotos] = useState([]);
//   const [page, setPage] = useState(1);
//   // const [searchQuery, setSearchQuery] = useState('');

//   useEffect(() => {  
//     const fetchPhotos = async () => {
//       try {
//         const response = await axios.get(
//           `${process.env.REACT_APP_API_URL}/photos?category=${category}&page=${page}`
//         );
//         setPhotos(response.data);
//       } catch (error) {
//         console.error('Error fetching photos:', error);
//       }
//     };
//     fetchPhotos();
//   }, [category, page]);

//   // const handleSearch = (query) => {
//   //   setSearchQuery(query);
//   // };

//   // // Filter photos based on the search query
//   // const filteredPhotos = photos.filter((photo) =>
//   //   photo.name.toLowerCase().includes(searchQuery.toLowerCase())
//   // );

//   return (
//     <div className="photos">
//       {/* <Header onSearch={handleSearch} /> */}
//       <h1>Photos - {category}</h1>
//       <PhotoGrid photos={isSearching?filteredPhotos:photos} />
//       <button className={`load-more-btn ${theme}`} onClick={() => setPage(page + 1)} disabled={isLoading}>
//       {isLoading ? <span className="spinner"></span> : <>"Load More" <FaForward className='far-forward' /></>}
//         </button>
//     </div>
//   );
// };

// export default Photos;


import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { ThemeContext } from '../App';
import { useSearchParams } from 'react-router-dom';
import PhotoGrid from '../components/PhotoGrid';
import Header from '../components/Header';
import { FaForward, FaPlay } from 'react-icons/fa';

const Photos = ({ filteredPhotos, isSearching, activeCategoryName: propActiveCategoryName }) => {
  const { theme } = useContext(ThemeContext);  // Assuming theme is coming from ThemeContext
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);  // Added state for loading indicator
  const [activeCategoryName, setActiveCategoryName] = useState(propActiveCategoryName || '');

  // Effect to set activeCategoryName from localStorage if not provided as prop
  useEffect(() => {
    if (!propActiveCategoryName) {
      const storedCategoryName = localStorage.getItem('activeCategoryName');
      if (storedCategoryName) {
        setActiveCategoryName(storedCategoryName);
      }
    }
  }, [propActiveCategoryName]);  // Dependency on propActiveCategoryName

  useEffect(() => {
    const fetchPhotos = async () => {
      setIsLoading(true);  // Set loading state to true when fetching starts
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/photos?category=${category}&page=${page}`
        );
        setPhotos(response.data);
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setIsLoading(false);  // Set loading state to false when fetching finishes (success or error)
      }
    };
    fetchPhotos();
  }, [category, page]);

  return (
    <div className="photos">
      <h1>Photos - {activeCategoryName}</h1>
      <PhotoGrid photos={isSearching ? filteredPhotos : photos } activeCategoryName={activeCategoryName} />
      <button
        className={`load-more-btn ${theme === 'dark' ? 'dark' : ''}`}
        onClick={() => setPage(page + 1)}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="spinner"></span>
        ) : (
          <>Load More <FaForward className='far-forward' /></>
        )}
      </button>
    </div>
  );
};

export default Photos;