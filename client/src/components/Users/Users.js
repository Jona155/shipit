import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import UserList from './UserList';
import UserForm from './UserForm';
import './Users.css';

// Mock initial user data
const initialUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'courier', availability: 'in_shift' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'dispatcher', availability: 'out_of_shift' },
];

const Users = () => {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState(initialUsers);
  const [editingUser, setEditingUser] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const isRTL = i18n.language === 'he';

  const addUser = (user) => {
    setUsers([...users, { ...user, id: Date.now() }]);
    setIsFormVisible(false);
  };

  const updateUser = (updatedUser) => {
    setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
    setEditingUser(null);
    setIsFormVisible(false);
  };

  const deleteUser = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const toggleAvailability = (userId) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        const newAvailability = user.availability === 'in_shift' ? 'out_of_shift' : 'in_shift';
        return { ...user, availability: newAvailability };
      }
      return user;
    }));
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

  return (
    <div className={`users-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <h1>{t('users_management')}</h1>
      <button onClick={handleNewUser} className="new-user-button">{t('new_user')}</button>
      <UserList 
        users={users} 
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