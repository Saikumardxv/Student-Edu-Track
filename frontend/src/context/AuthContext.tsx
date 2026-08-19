import React, { createContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../utils/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'FACULTY' | 'STUDENT';
  departmentId: number | null;
  photo: string | null;
  studentId?: number;
  rollNumber?: string;
  currentSemester?: number;
  facultyId?: number;
  employeeId?: string;
  departmentName?: string;
  departmentCode?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize from stored access token and user (no refresh token flow)
        const storedUser = localStorage.getItem('user');
        const storedAccess = localStorage.getItem('accessToken');
        if (storedUser && storedAccess) {
          setAccessToken(storedAccess);
          setUser(JSON.parse(storedUser));
        } else {
          setAccessToken('');
          setUser(null);
        }
      } catch (err) {
        setAccessToken('');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, user: userData } = response.data;
    setAccessToken(accessToken);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccessToken('');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
