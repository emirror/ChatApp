import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './providers/AuthProvider';
import Login from './pages/Login';
import ChatApp from './pages/ChatApp';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const theme = {
    token: {
      colorPrimary: '#ce0202',
    },
  };

  function App() {
    return (
      <ConfigProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatApp />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/chat" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </ConfigProvider>
    );
}

export default App;



