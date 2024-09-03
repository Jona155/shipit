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
          <th>{t('user_phone')}</th>
          <th>{t('user_type')}</th>
          <th>{t('user_availability')}</th>
          <th>{t('user_actions')}</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.uid}>
            <td data-label={t('user_name')}>{user.name}</td>
            <td data-label={t('user_phone')}>{user.phoneNumber}</td>
            <td data-label={t('user_type')}>{t(user.type)}</td>
            <td data-label={t('user_availability')}>
              {user.type === 'messenger' && (
                <button 
                  onClick={() => onToggleAvailability(user.uid)}
                  className={`availability-toggle ${user.isCurrentlyOnShift ? 'in_shift' : 'out_of_shift'}`}
                >
                  {t(user.isCurrentlyOnShift ? 'in_shift' : 'out_of_shift')}
                </button>
              )}
            </td>
            <td data-label={t('user_actions')}>
              <button onClick={() => onEdit(user)}>{t('edit')}</button>
              <button onClick={() => onDelete(user.uid)}>{t('delete')}</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserList;