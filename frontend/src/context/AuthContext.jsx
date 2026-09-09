import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('x_spend_token');
    localStorage.removeItem('x_spend_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('x_spend_token');
      const savedUser = localStorage.getItem('x_spend_user');
      if (token && savedUser) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const { data } = await axios.get('/api/auth/me');
          setUser(data);
          localStorage.setItem('x_spend_user', JSON.stringify(data));
        } catch (err) {
          if (err.response && err.response.status === 401) {
            logout();
          } else {
            setUser(JSON.parse(savedUser));
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error.response &&
          error.response.status === 401 &&
          !error.config?.url?.includes('/api/auth/login') &&
          !error.config?.url?.includes('/api/auth/register') &&
          !error.config?.url?.includes('/api/auth/forgot-password') &&
          !error.config?.url?.includes('/api/auth/reset-password')
        ) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('x_spend_token', data.token);
    localStorage.setItem('x_spend_user', JSON.stringify({
      _id: data._id,
      username: data.username,
      email: data.email,
      dashboardStartDate: data.dashboardStartDate,
      dashboardEndDate: data.dashboardEndDate
    }));
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser({
      _id: data._id,
      username: data.username,
      email: data.email,
      dashboardStartDate: data.dashboardStartDate,
      dashboardEndDate: data.dashboardEndDate
    });
    return data;
  };

  const register = async (username, email, password) => {
    const { data } = await axios.post('/api/auth/register', { username, email, password });
    localStorage.setItem('x_spend_token', data.token);
    localStorage.setItem('x_spend_user', JSON.stringify({
      _id: data._id,
      username: data.username,
      email: data.email,
      dashboardStartDate: data.dashboardStartDate,
      dashboardEndDate: data.dashboardEndDate
    }));
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser({
      _id: data._id,
      username: data.username,
      email: data.email,
      dashboardStartDate: data.dashboardStartDate,
      dashboardEndDate: data.dashboardEndDate
    });
    return data;
  };


  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
