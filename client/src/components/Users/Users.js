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
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format: expected an array');
        }
        
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
      console.log("Adding new user:", user);
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
      console.log("User created with ID:", data.userId);
      
      // After creating the user, fetch the complete user data to ensure we have the correct structure
      try {
        // Wait a moment for the server to complete processing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fetch the complete business users list to get the proper structure
        const usersResponse = await fetch(`${API_BASE_URL}/api/users/business/${businessId}/`);
        if (!usersResponse.ok) {
          throw new Error("Failed to fetch updated user list");
        }
        
        const usersData = await usersResponse.json();
        console.log("Fetched updated user list");
        
        // Find the newly created user in the response
        const newUserData = usersData.find(u => u.uid === data.userId);
        
        if (newUserData) {
          console.log("Found newly created user in response:", newUserData);
          // Process the data to properly map isCurrentlyOnShift
          const isMessenger = newUserData.profiles && newUserData.profiles.messenger;
          const newUser = {
            ...newUserData,
            type: isMessenger ? 'messenger' : 'dispatcher',
            isCurrentlyOnShift: isMessenger ? newUserData.profiles.messenger.isCurrentlyOnShift : false
          };
          
          // Update the users list with the complete data
          setUsers([...users, newUser]);
        } else {
          console.log("User created but not found in updated list, using partial data");
          // Fall back to creating a simplified user object if we can't find it
          const newUser = {
            ...user,
            uid: data.userId,
            type: user.type,
            isCurrentlyOnShift: user.type === 'messenger' ? user.isCurrentlyOnShift : false,
            profiles: {
              [user.type]: {
                isCurrentlyOnShift: user.type === 'messenger' ? user.isCurrentlyOnShift : false,
                isCurrentlyAvailable: user.type === 'messenger' ? user.isCurrentlyOnShift : false,
                isWhileMission: false
              }
            }
          };
          setUsers([...users, newUser]);
        }
      } catch (fetchErr) {
        console.error("Error fetching complete user data:", fetchErr);
        // Fall back to creating a simplified user object with the profiles structure
        const newUser = {
          ...user,
          uid: data.userId,
          type: user.type,
          isCurrentlyOnShift: user.type === 'messenger' ? user.isCurrentlyOnShift : false,
          profiles: {
            [user.type]: {
              isCurrentlyOnShift: user.type === 'messenger' ? user.isCurrentlyOnShift : false,
              isCurrentlyAvailable: user.type === 'messenger' ? user.isCurrentlyOnShift : false,
              isWhileMission: false
            }
          }
        };
        setUsers([...users, newUser]);
      }
      
      setIsFormVisible(false);
      setError(null);
    } catch (err) {
      console.error("Error adding user:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedUser) => {
    try {
      console.log("Updating user:", updatedUser);
      // Prepare user data for API
      const userForApi = {
        ...updatedUser,
      };
      
      console.log("Sending to API:", JSON.stringify(userForApi));
      
      const response = await fetch(`${API_BASE_URL}/api/users/update/${updatedUser.uid}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForApi),
      });

      // Check response status and log it
      console.log("Response status:", response.status, response.statusText);
      
      // Check if there's any content in the response
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Invalid content type or empty response from server");
        throw new Error("Server returned an invalid or empty response");
      }

      // Try to parse the response
      const responseText = await response.text();
      console.log("Response text:", responseText);
      
      // If the response is empty, handle it gracefully
      if (!responseText.trim()) {
        console.error("Empty response from server");
        throw new Error("Server returned an empty response");
      }
      
      const responseData = JSON.parse(responseText);
      console.log("Parsed response:", responseData);
      
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
      setError(`${t('error_updating_user')}: ${err.message}`);
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
      console.log("Toggling availability for user ID:", userId);
      const user = users.find(u => u.uid === userId);
      if (!user || user.type !== 'messenger') {
        throw new Error(t('invalid_user_or_not_messenger'));
      }
      
      console.log("Current user data:", user);
      const newShiftStatus = !user.isCurrentlyOnShift;
      console.log("Setting new shift status to:", newShiftStatus);
      
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
      
      console.log("Built updatedUser object:", updatedUser);
      
      const success = await updateUser(updatedUser);
      
      if (success) {
        console.log("Successfully updated user shift status");
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