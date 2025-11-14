import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Input, Button, List, Avatar, message } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import { Socket } from 'socket.io-client';
import { request } from '../utils/request';
import type { User, Message as MessageType } from '../types';

interface ChatWindowProps {
  socket: Socket;
  selectedUser: User;
  currentUser: User;
}

export default function ChatWindow({
  socket,
  selectedUser,
  currentUser,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = useCallback(async (lastMessageId?: string) => {
    try {
      setLoading(true);
      const params: { channel: string; lastMessage?: string } = {
        channel: selectedUser._id,
      };
      if (lastMessageId) {
        params.lastMessage = lastMessageId;
      }

      const { data } = await request.get<{ status: string; data: MessageType[] }>(
        '/api/message',
        { params }
      );

      if (lastMessageId) {
        const prevScrollHeight = wrapperRef.current?.scrollHeight || 0;
        setMessages((prev) => [...data.data.reverse(), ...prev]);
        setTimeout(() => {
          if (wrapperRef.current) {
            const newScrollHeight = wrapperRef.current.scrollHeight;
            wrapperRef.current.scrollTop = newScrollHeight - prevScrollHeight;
          }
        }, 0);
      } else {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      message.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [selectedUser._id]);

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const handleMessage = (newMessage: MessageType) => {
      console.log('newMessage:', newMessage);
      const fromId = String(newMessage.from);
      const toId = String(newMessage.to);
      const currentUserId = String(currentUser._id);
      const selectedUserId = String(selectedUser._id);
      
      if (
        (fromId === currentUserId && toId === selectedUserId) ||
        (fromId === selectedUserId && toId === currentUserId)
      ) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === newMessage._id);
          if (exists) {
            return prev;
          }
          return [...prev, newMessage];
        });
      } else {
        console.log('Message not for current conversation', {
          fromId,
          toId,
          currentUserId,
          selectedUserId,
        });
      }
    };

    socket.on('message', handleMessage);
    socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      message.error(error.message || 'Socket error occurred');
    });

    return () => {
      socket.off('message', handleMessage);
      socket.off('error');
    };
  }, [selectedUser._id, currentUser._id, socket]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    console.log('Sending message:', { message: inputValue, to: selectedUser._id });
    socket.emit('message', {
      message: inputValue,
      to: selectedUser._id,
    });

    setInputValue('');
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop === 0 && messages.length > 0) {
      const firstMessage = messages[0];
      loadMessages(firstMessage._id);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} />
          <div>
            <h3 className="m-0 font-semibold">{selectedUser.username}</h3>
          </div>
        </div>
      </div>

      <div
        ref={wrapperRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
        onScroll={handleScroll}
      >
        {loading && messages.length === 0 ? (
          <div className="flex justify-center p-8">
            <span>Loading messages...</span>
          </div>
        ) : (
          <List
            dataSource={messages}
            renderItem={(msg) => {
              const isOwn = String(msg.from) === String(currentUser._id);
              return (
                <div
                  className={`mb-4 flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-primary text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p className="m-0 mb-1">{msg.message}</p>
                    <span
                      className={`text-xs ${
                        isOwn ? 'text-white/70' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            }}
            locale={{ emptyText: 'No messages yet. Start a conversation!' }}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleSend}
            placeholder="Type a message..."
            size="large"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            size="large"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

