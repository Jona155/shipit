import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import UserList from './UserList';
import UserForm from './UserForm';
import Loader from '../Loader';
import './Users.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Users = () => {
  const { t, i18n } = useTranslation();
  const { businessId } = useParams();
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all-users');
  const [filterType, setFilterType] = useState('all');

  const isRTL = i18n.language === 'he';

  // Reset filter type when changing tabs
  useEffect(() => {
    if (activeTab === 'all-users') {
      setFilterType('all');
    } else if (activeTab === 'on-shift-couriers') {
      setFilterType('courier');
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/business/${businessId}/`);
        if (!response.ok) {
          throw new Error(t('failed_to_fetch_users'));
        }
        const data = await response.json();
        
        // Process the data to properly map isCurrentlyOnShift
        const processedUsers = data.map(user => {
          // Find if the user is a messenger and has shift status
          const isMessenger = user.profiles && user.profiles.messenger;
          const isOnShift = isMessenger ? user.profiles.messenger.isCurrentlyOnShift : false;
          
          return {
            ...user,
            type: isMessenger ? 'messenger' : 'dispatcher',
            isCurrentlyOnShift: isOnShift
          };
        });
        
        setUsers(processedUsers);
        setError(null);
      } catch (err) {
        console.error(t('error_fetching_users'), err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [businessId, t]);

  const addUser = async (user) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/add/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...user,
          businessId: businessId
        }),
      });
  
      if (!response.ok) {
        throw new Error(`${t('failed_to_add_user')}: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      
      // Create processed user object with proper structure
      const newUser = {
        ...user,
        uid: data.userId,
        type: user.type,
        isCurrentlyOnShift: user.type === 'messenger' ? user.isCurrentlyOnShift : false
      };
      
      setUsers([...users, newUser]);
      setIsFormVisible(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedUser) => {
    try {
      // Prepare user data for API
      const userForApi = {
        ...updatedUser,
      };
      
      const response = await fetch(`${API_BASE_URL}/api/users/update/${updatedUser.uid}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForApi),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || t('failed_to_update_user'));
      }

      // Update local state with the updated user
      setUsers(users.map(user => user.uid === updatedUser.uid ? updatedUser : user));
      setEditingUser(null);
      setIsFormVisible(false);
      return true;
    } catch (err) {
      console.error(t('error_updating_user'), err);
      setError(err.message);
      return false;
    }
  };

  const deleteUser = async (userId) => {
    // Display confirmation dialog before deleting user
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        // Make API call to delete user
        const response = await fetch(`${API_BASE_URL}/api/users/delete/${userId}/`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(t('failed_to_delete_user'));
        }

        setUsers(users.filter(user => user.uid !== userId));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const toggleAvailability = async (userId) => {
    try {
      const user = users.find(u => u.uid === userId);
      if (!user || user.type !== 'messenger') {
        throw new Error(t('invalid_user_or_not_messenger'));
      }
      
      const newShiftStatus = !user.isCurrentlyOnShift;
      
      // Prepare an updated user with the modified shift status
      const updatedUser = { 
        ...user, 
        type: 'messenger', // Ensure type is included
        isCurrentlyOnShift: newShiftStatus,
        // Add additional properties required by the API
        profilesUpdate: {
          messenger: {
            isCurrentlyOnShift: newShiftStatus,
            isCurrentlyAvailable: newShiftStatus, // Set availability to match shift status
            isWhileMission: false // Always set to false when toggling
          }
        }
      };
      
      const success = await updateUser(updatedUser);
      
      if (success) {
        // If updateUser succeeded but didn't update our state (timing issue),
        // manually update the user's status in the local state
        setUsers(prev => prev.map(u => {
          if (u.uid === userId) {
            return {
              ...u,
              isCurrentlyOnShift: newShiftStatus
            };
          }
          return u;
        }));
      }
    } catch (err) {
      console.error(t('error_toggling_availability'), err);
      setError(`${t('failed_to_toggle_availability')}: ${err.message}`);
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

  const handleFilterChange = (event) => {
    setFilterType(event.target.value);
  };

  const filteredUsers = users.filter(user => {
    // Apply search filter
    const matchesSearch = user.name.toLowerCase().includes(searchTerm) ||
      (user.phoneNumber && user.phoneNumber.toLowerCase().includes(searchTerm));
    
    // Apply user type filter
    let matchesType = true;
    if (filterType === 'courier') {
      matchesType = user.type === 'messenger';
    } else if (filterType === 'dispatcher') {
      matchesType = user.type === 'dispatcher';
    }

    // Apply tab filter - only show on-shift couriers in the on-shift-couriers tab
    let matchesTab = true;
    if (activeTab === 'on-shift-couriers') {
      matchesTab = user.type === 'messenger' && user.isCurrentlyOnShift === true;
    }

    return matchesSearch && matchesType && matchesTab;
  });

  if (isLoading) return <Loader />;
  if (error) return <div>{t('error')}: {error}</div>;

  return (
    <div className={`users-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <h1>{t('users_management')}</h1>
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'all-users' ? 'active' : ''}`}
          onClick={() => setActiveTab('all-users')}
        >
          {t('all_users')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'on-shift-couriers' ? 'active' : ''}`}
          onClick={() => setActiveTab('on-shift-couriers')}
        >
          {t('on_shift_couriers')}
        </button>
      </div>
      
      {/* Filter and Search - Only shown in All Users tab */}
      {activeTab === 'all-users' && (
        <div className="users-actions">
          <div className="filters-container">
            <select 
              value={filterType} 
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">{t('all_users')}</option>
              <option value="courier">{t('couriers_only')}</option>
              <option value="dispatcher">{t('dispatchers_only')}</option>
            </select>
            
            <div className="search-container">
              <input
                type="text"
                placeholder={t('search_users')}
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
          </div>
          <button onClick={handleNewUser} className="new-user-button">
            {t('new_user')}
          </button>
        </div>
      )}
      
      {/* Simplified Search for On Shift Couriers tab */}
      {activeTab === 'on-shift-couriers' && (
        <div className="users-actions">
          <div className="filters-container">
            <div className="search-container">
              <input
                type="text"
                placeholder={t('search_users')}
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
          </div>
          <button onClick={handleNewUser} className="new-user-button">
            {t('new_courier')}
          </button>
        </div>
      )}
      
      {/* User count info */}
      <div className="user-count-info">
        {filteredUsers.length > 0 ? 
          `${t('displaying')} ${filteredUsers.length} ${filteredUsers.length === 1 ? t('user') : t('users')}` :
          t('no_users_found')
        }
      </div>
      
      {/* User List */}
      <div className="card-container">
        <UserList 
          users={filteredUsers} 
          onEdit={handleEdit} 
          onDelete={deleteUser}
          onToggleAvailability={toggleAvailability}
          view={activeTab}
        />
      </div>
      
      {/* Side Panel with Form */}
      {isFormVisible && (
        <div className="side-panel visible">
          <button onClick={handleCloseForm} className="close-panel">×</button>
          <UserForm 
            onSubmit={editingUser ? updateUser : addUser} 
            initialData={editingUser} 
            onClose={handleCloseForm}
            defaultType={activeTab === 'on-shift-couriers' ? 'messenger' : undefined}
            defaultOnShift={activeTab === 'on-shift-couriers'}
          />
        </div>
      )}
    </div>
  );
};

export default Users; 