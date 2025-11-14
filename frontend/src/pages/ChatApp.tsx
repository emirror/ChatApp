import { useState, useEffect } from 'react';
import { Layout, List, Avatar, Input, Button, Empty, Spin } from 'antd';
import { UserOutlined, SendOutlined, LogoutOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import io, { Socket } from 'socket.io-client';
import useAuth from '../hooks/useAuth';
import { request } from '../utils/request';
import { getAccessToken } from '../utils/token';
import ChatWindow from '../components/ChatWindow';
import type { User } from '../types';

const { Header, Sider, Content } = Layout;

export default function ChatApp() {
  const { user, logout } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await request.get<{ status: string; data: User[] }>(
        '/api/message/users'
      );
      return data.data;
    },
  });

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: {
        token,
      },
      extraHeaders: {
        Authorization: token,
      },
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleLogout = () => {
    logout();
    socket?.close();
  };

  return (
    <Layout className="h-screen">
      <Header className="bg-primary flex items-center justify-between px-6">
        <h1 className="text-white text-xl font-bold m-0">Chat App</h1>
        <div className="flex items-center gap-4">
          <span className="text-white">Welcome, {user?.username}</span>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="text-white hover:bg-white/20"
          >
            Logout
          </Button>
        </div>
      </Header>

      <Layout>
        <Sider
          width={300}
          className="bg-white border-r border-gray-200 overflow-y-auto"
        >
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold m-0">Users</h2>
          </div>
          {usersLoading ? (
            <div className="flex justify-center p-8">
              <Spin />
            </div>
          ) : (
            <List
              dataSource={users}
              renderItem={(item) => (
                <List.Item
                  className={`cursor-pointer hover:bg-gray-50 ${
                    selectedUser?._id === item._id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedUser(item)}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={item.username}
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No users available' }}
            />
          )}
        </Sider>

        <Content className="flex-1">
          {selectedUser && socket ? (
            <ChatWindow socket={socket} selectedUser={selectedUser} currentUser={user!} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <Empty
                description="Select a user to start chatting"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

