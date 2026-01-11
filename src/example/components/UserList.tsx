import React, { useEffect } from 'react';
import { useSelector, useDispatch, useQuery } from '../../hooks';
import {
  selectUsers,
  selectUsersLoading,
  selectUsersError,
  fetchUsers,
  fetchUserById,
  setSelectedUser
} from '../store/slices/users.slice';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
}

export function UserList() {
  const users = useSelector(selectUsers);
  const isLoading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);
  const dispatch = useDispatch();

  // Using useQuery hook for API calls
  const {
    data: apiUsers,
    isLoading: apiLoading,
    error: apiError,
    refetch
  } = useQuery<User[]>({
    url: '/users',
    method: 'GET',
    enabled: false, // Manual trigger
  });

  useEffect(() => {
    // Dispatch API action
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleRefetch = () => {
    dispatch(fetchUsers());
  };

  const handleRefetchWithHook = () => {
    refetch();
  };

  const handleUserClick = (user: User) => {
    dispatch(setSelectedUser(user));
    dispatch(fetchUserById(user.id));
  };

  if (isLoading || apiLoading) {
    return (
      <div style={{
        padding: '20px',
        border: '2px solid #06B6D4',
        borderRadius: '8px',
        backgroundColor: '#FAFAFA'
      }}>
        <h2>Users Demo</h2>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          Loading users...
        </div>
      </div>
    );
  }

  if (error || apiError) {
    return (
      <div style={{
        padding: '20px',
        border: '2px solid #EF4444',
        borderRadius: '8px',
        backgroundColor: '#FAFAFA'
      }}>
        <h2>Users Demo</h2>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>❌</div>
          Error: {error || apiError?.message}
          <br />
          <button
            onClick={handleRefetch}
            style={{ ...buttonStyle, marginTop: '10px' }}
          >
            Retry (Action)
          </button>
          <button
            onClick={handleRefetchWithHook}
            style={{ ...buttonStyle, marginTop: '10px', marginLeft: '10px' }}
          >
            Retry (Hook)
          </button>
        </div>
      </div>
    );
  }

  const displayUsers = users.length > 0 ? users : apiUsers || [];

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #06B6D4',
      borderRadius: '8px',
      backgroundColor: '#FAFAFA'
    }}>
      <h2>Users Demo</h2>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleRefetch}
          style={buttonStyle}
        >
          Refetch (Action)
        </button>
        <button
          onClick={handleRefetchWithHook}
          style={{ ...buttonStyle, marginLeft: '10px' }}
        >
          Refetch (Hook)
        </button>
      </div>

      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        border: '1px solid #E5E7EB',
        borderRadius: '4px'
      }}>
        {displayUsers.map((user) => (
          <div
            key={user.id}
            onClick={() => handleUserClick(user)}
            style={{
              padding: '12px',
              borderBottom: '1px solid #E5E7EB',
              cursor: 'pointer',
              backgroundColor: 'white',
              transition: 'background-color 0.2s',
              ':hover': { backgroundColor: '#F9FAFB' }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            <div style={{ fontWeight: 'bold', color: '#06B6D4' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              @{user.username} • {user.email}
            </div>
          </div>
        ))}
      </div>

      {displayUsers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
          No users found
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#F3F4F6', borderRadius: '4px', fontSize: '12px' }}>
        <strong>API Integration:</strong>
        <br />• Uses createApiMiddleware for automatic request/response handling
        <br />• Actions dispatch REQUEST → SUCCESS/FAILURE automatically
        <br />• useQuery hook provides {`{ data, isLoading, error, refetch }`}
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#06B6D4',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
  transition: 'background-color 0.2s',
};
