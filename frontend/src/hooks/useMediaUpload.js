import { useState, useCallback } from 'react';
import axios from 'axios';

const useMediaUpload = () => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const validateFiles = (files) => {
    for (let file of files) {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File ${file.name} exceeds 100MB limit`);
      }
    }
    return true;
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    try {
      validateFiles(files);
      setMediaFiles(files);
      setUploadError(null);
    } catch (error) {
      setUploadError(error.message);
      return false;
    }
    return true;
  };

  const uploadMedia = useCallback(async (roomId, type) => {
    if (!mediaFiles.length) return null;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      mediaFiles.forEach(file => {
        formData.append('media', file);
      });
      formData.append('roomId', roomId);
      formData.append('type', type);

      console.log('mediaFiles',mediaFiles);
      console.log('formData',formData);
      

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/upload-media`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(prev => ({
              ...prev,
              [mediaFiles[0].name]: percentCompleted
            }));
          }
        }
      );

      setMediaFiles([]);
      return response.data;
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.response?.data?.message || 'Upload failed');
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  }, [mediaFiles]);

  const clearFiles = () => {
    setMediaFiles([]);
    setUploadError(null);
    setUploadProgress({});
  };

  return {
    mediaFiles,
    uploadProgress,
    uploadError,
    isUploading,
    handleFileChange,
    uploadMedia,
    clearFiles
  };
};

export default useMediaUpload;