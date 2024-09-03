import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import UserList from './UserList';
import UserForm from './UserForm';
import './Users.css';

const API_BASE_URL = 'http://127.0.0.1:5000';

const Users = () => {
  const { t, i18n } = useTranslation();
  const { businessId } = useParams();
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isRTL = i18n.language === 'he';

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/business/${businessId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [businessId]);

  const addUser = (user) => {
    // TODO: Implement user addition via API
    setUsers([...users, { ...user, uid: Date.now().toString() }]);
    setIsFormVisible(false);
  };

  const updateUser = async (updatedUser) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/update/${updatedUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      setUsers(users.map(user => user.uid === updatedUser.uid ? updatedUser : user));
      setEditingUser(null);
      setIsFormVisible(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/delete/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(users.filter(user => user.uid !== userId));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleAvailability = async (userId) => {
    const user = users.find(u => u.uid === userId);
    if (user && user.type === 'messenger') {
      const updatedUser = { 
        ...user, 
        isCurrentlyOnShift: !user.isCurrentlyOnShift 
      };
      await updateUser(updatedUser);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsFormVisible(true);
  };

  const handleNewUser = () => {
    setEditingUser(null);
    setIsFormVisible(true);
  };

  const handleCloseForm = () => {
    setIsFormVisible(false);
    setEditingUser(null);
  };

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value.toLowerCase());
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm) ||
    (user.phoneNumber && user.phoneNumber.toLowerCase().includes(searchTerm))
  );

  if (isLoading) return <div>{t('loading')}</div>;
  if (error) return <div>{t('error')}: {error}</div>;

  return (
    <div className={`users-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <h1>{t('users_management')}</h1>
      <div className="users-actions">
        <div className="search-container">
          <input
            type="text"
            placeholder={t('search_users')}
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        <button onClick={handleNewUser} className="new-user-button">{t('new_user')}</button>
      </div>
      <UserList 
        users={filteredUsers} 
        onEdit={handleEdit} 
        onDelete={deleteUser}
        onToggleAvailability={toggleAvailability}
      />
      {isFormVisible && (
        <div className="side-panel visible">
          <button onClick={handleCloseForm} className="close-panel">×</button>
          <UserForm 
            onSubmit={editingUser ? updateUser : addUser} 
            initialData={editingUser} 
            onClose={handleCloseForm}
          />
        </div>
      )}
    </div>
  );
};

export default Users;