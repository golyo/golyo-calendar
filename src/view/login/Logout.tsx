import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthState, useAuth } from '../../hooks/auth';

const Logout = () => {
  const { logout, authState } = useAuth();

  useEffect(() => {
    if (authState === AuthState.AUTHORIZED || authState === AuthState.VERIFIED) {
      logout();
    }
  }, [authState, logout]);

  if (authState !== AuthState.INIT) {
    return (
      <Navigate to="/login" />
    );
  }
  return <div>...</div>;
};

export default Logout;
