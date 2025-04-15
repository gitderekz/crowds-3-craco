import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaArrowAltCircleRight, FaArrowCircleRight, FaArrowRight, FaRegArrowAltCircleRight } from 'react-icons/fa';
import { api, publicApi, getRefreshToken, setupTokenRefresh } from '../services/authService';

const CategoryFilter = ({clearSearch,setActiveCategoryName}) => {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const navigate = useNavigate();
  const categoryFilterRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState(null);

  // Scroll by a fixed amount
  const scrollAmount = 100;

  const scroll = (direction) => {
    if (categoryFilterRef.current) {
      categoryFilterRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Handle scroll-on-hold
  useEffect(() => {
    let scrollInterval;
    if (isScrolling) {
      scrollInterval = setInterval(() => scroll(scrollDirection), 100);
    }
    return () => clearInterval(scrollInterval);
  }, [isScrolling, scrollDirection]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // const response = await axios.get(`${process.env.REACT_APP_API_URL}/categories`);
        const response = await api.get(`/categories`);
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (category,categoryName) => {
    setActiveCategoryName(categoryName);
    localStorage.setItem('activeCategoryName',categoryName);
    clearSearch();
    setActiveCategory(category); // Set the active category
    navigate(`/photos?category=${category}`);
  };

  const goHome = (category) => {
    setActiveCategory(category); // Set the active category
    navigate('/');
  };

  return (
    <div className="filter-container">
      <button
        className="scroll-arrow left-arrow"
        onMouseDown={() => {
          setScrollDirection('left');
          setIsScrolling(true);
        }}
        onMouseUp={() => setIsScrolling(false)}
        onMouseLeave={() => setIsScrolling(false)}
      >
        ←
      </button>
      <div className="category-filter" ref={categoryFilterRef}>
        <button
          key="home"
          className={`category-button ${activeCategory === 'home' ? 'active' : ''}`}
          onClick={() => goHome('home')}
        >
          Home
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-button ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => handleCategoryClick(cat.id,cat.name)}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <button
        className="scroll-arrow right-arrow"
        onMouseDown={() => {
          setScrollDirection('right');
          setIsScrolling(true);
        }}
        onMouseUp={() => setIsScrolling(false)}
        onMouseLeave={() => setIsScrolling(false)}
      >
        →
      </button>
    </div>
  );
};

export default CategoryFilter;
