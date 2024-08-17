import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// Connect to the Socket.io server
const socket = io('http://localhost:3030');

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('http://localhost:3030/messages');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Fetched messages:', data);

        // Ensure data is an array and format messages
        if (Array.isArray(data)) {
          const formattedMessages = data.map(msg => ({
            id: msg.id,
            text: msg.text || 'No text available', // Ensure text field
            sentByMe: false, // Adjust as needed
            date: msg.date || new Date().toLocaleString() // Ensure date field
          }));

          // Update state without duplicating messages
          setMessages(prevMessages => {
            const newMessages = formattedMessages.filter(msg => !prevMessages.some(prevMsg => prevMsg.id === msg.id));
            return [...prevMessages, ...newMessages];
          });
        } else {
          console.error('Unexpected data format:', data);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    fetchMessages();

    // Listen for new messages from the server
    socket.on('messages created', (newMessage) => {
      console.log('New message received:', newMessage);
      setMessages(prevMessages => {
        // Ensure no duplicate messages are added
        if (!prevMessages.some(msg => msg.id === newMessage.id)) {
          return [...prevMessages, newMessage];
        }
        return prevMessages;
      });
    });

    return () => {
      socket.off('messages created');
    };
  }, []);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const newMessage = {
      text: input.trim(), // Ensure text is correctly set
      sentByMe: true,
      date: new Date().toLocaleString()
    };

    try {
      console.log('Sending message:', newMessage);
      const response = await fetch('http://localhost:3030/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Error response:', error);
      } else {
        const message = await response.json();
        console.log('Message sent successfully:', message);
        setMessages(prevMessages => {
          // Ensure no duplicate messages are added
          if (!prevMessages.some(msg => msg.id === message.id)) {
            return [...prevMessages, message];
          }
          return prevMessages;
        });
        setInput(''); // Clear the input field only if the message was sent successfully
      }
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent default behavior
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.sentByMe ? 'sent' : 'received'}`}
            >
              <div className="text">{msg.text}</div>
              <div className="date">{msg.date}</div>
            </div>
          ))
        ) : (
          <div className="no-messages">No messages yet</div>
        )}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default App;
