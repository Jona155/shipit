import React from 'react';
import './UserList.css';
import { useTranslation } from 'react-i18next';

const UserList = ({ users, onEdit, onDelete, onToggleAvailability }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';

  return (
    <table className={`user-list ${isRTL ? 'rtl' : 'ltr'}`}>
      <thead>
        <tr>
          <th>{t('user_name')}</th>
          <th>{t('user_email')}</th>
          <th>{t('user_role')}</th>
          <th>{t('user_availability')}</th>
          <th>{t('user_actions')}</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{t(user.role)}</td>
            <td>
              <button 
                onClick={() => onToggleAvailability(user.id)}
                className={`availability-toggle ${user.availability}`}
              >
                {t(user.availability)}
              </button>
            </td>
            <td>
              <button onClick={() => onEdit(user)}>{t('edit')}</button>
              <button onClick={() => onDelete(user.id)}>{t('delete')}</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserList;