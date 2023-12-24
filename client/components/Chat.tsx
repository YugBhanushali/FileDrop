import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { SendHorizonal } from 'lucide-react';

const Chat = () => {
  const [messages, setMessages] = useState<any[]>([
    { text: "hello", sender: 'other' }
  ]);
  const [newMessage, setNewMessage] = useState<any>('');

  const handleSendMessage = () => {
    if (newMessage.trim() !== '') {
      const newMessages = [...messages, { text: newMessage, sender: 'me' }];
      setMessages(newMessages);
      setNewMessage('');
    }
  };

  return (
    <div>
      <div className='flex flex-col flex-wrap relative border rounded-md w-[450px] h-[500px] p-2'>
        {/* chats */}
        <div className='flex-1 overflow-y-auto w-full'>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.sender === 'me' ? 'justify-end' : 'justify-start'
              } mb-[2px]`}
            >
              <div
                className={`flex flex-wrap max-w-[200px] text-sm rounded-3xl px-3 py-1 ${
                  message.sender === 'me'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        {/* chat box */}
        <div className='flex justify-between bottom-1 w-full space-x-1'>
          <div className='flex w-full'>
            <Input
              type='text'
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
          </div>
          <div className=''>
            <Button
              variant={'outline'}
              className='p-3'
              onClick={handleSendMessage}
            >
              <SendHorizonal size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
