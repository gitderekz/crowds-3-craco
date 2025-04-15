import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { ThemeContext } from '../App';
import { FaEdit, FaTrash } from 'react-icons/fa';
import RegisterClientModal from '../components/RegisterClientModal'; // Import the new RegisterClientModal component
import ConfirmationModal from '../components/ConfirmationModal'; // Import the new ConfirmationModal component

const Users = () => {
  const [users, setUsers] = useState([]);
  const { theme } = useContext(ThemeContext);
  const [isRegisterClientModalOpen, setIsRegisterClientModalOpen] = useState(false); // State for AuthModal
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false); // State for Confirmation Modal
  const [userToDelete, setUserToDelete] = useState(null); // State for the user to delete

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/users`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
          }
        );
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleEditRole = async (userId, newRole) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/users/${userId}/updateUserRole`, { role: newRole },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? { ...user, role: newRole } : user))
      );
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  // const handleDeleteUser = async (userId) => {
  //   if (window.confirm('Are you sure you want to delete this user?')) {
  //     try {
  //       await axios.delete(`${process.env.REACT_APP_API_URL}/users/${userId}`,
  //         {
  //           headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
  //         });
  //       setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
  //     } catch (error) {
  //       console.error('Error deleting user:', error);
  //     }
  //   }
  // };
  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
    setIsConfirmationModalOpen(true); // Open the confirmation modal
  };

  const confirmDeleteUser = async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/users/${userToDelete}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userToDelete));
      setIsConfirmationModalOpen(false); // Close the modal after deletion
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const cancelDeleteUser = () => {
    setIsConfirmationModalOpen(false); // Close the modal if canceled
    setUserToDelete(null);
  };

  return (
    <div className="users">
      <h1 className='user-table-heading'>Users <button className={`register-client-btn ${theme === 'dark' ? 'dark' : ''}`} onClick={() => setIsRegisterClientModalOpen(true)}>Register Client</button></h1>
      <table>
        <thead>
          <tr>
            <th>Avatar</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Photos</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <img src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${user?.avatar??"/uploads/1739646618439-ai-generated-7832244_1280.jpg"}`} alt={user.username} className="user-avatar" />
              </td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>
                <select className='select'
                  value={user.role}
                  onChange={(e) => handleEditRole(user.id, e.target.value)}
                >
                  <option value="visitor">Visitor</option>
                  <option value="publisher">Publisher</option>
                </select>
              </td>
              <td>{user.photoCount}</td>
              <td>
                <button className='delete-client' onClick={() => handleDeleteUser(user.id)}>
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Register Client Modal */}
      {isRegisterClientModalOpen && (
        <RegisterClientModal onClose={() => setIsRegisterClientModalOpen(false)} />
      )}
      {/* Confirmation Modal */}
      {isConfirmationModalOpen && (
        <ConfirmationModal
          message="Are you sure you want to delete this user?"
          onConfirm={confirmDeleteUser}
          onCancel={cancelDeleteUser}
          theme={theme}
        />
      )}
    </div>
  );
};

export default Users;