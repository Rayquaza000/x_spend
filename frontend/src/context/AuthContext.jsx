import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('x_spend_token');
    const savedUser = localStorage.getItem('x_spend_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('x_spend_token', data.token);
    localStorage.setItem('x_spend_user', JSON.stringify({ _id: data._id, username: data.username, email: data.email }));
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser({ _id: data._id, username: data.username, email: data.email });
    return data;
  };

  const register = async (username, email, password) => {
    const { data } = await axios.post('/api/auth/register', { username, email, password });
    localStorage.setItem('x_spend_token', data.token);
    localStorage.setItem('x_spend_user', JSON.stringify({ _id: data._id, username: data.username, email: data.email }));
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser({ _id: data._id, username: data.username, email: data.email });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('x_spend_token');
    localStorage.removeItem('x_spend_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
