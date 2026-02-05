import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [greetingsList, setGreetingsList] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchGreetingsFromAPI = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch('/api/greetings');
      const data = await response.json();
      setGreetingsList(data.greetings || []);
    } catch (err) {
      console.error('Failed to fetch greetings:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const submitNewGreeting = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      await fetch('/api/greetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageInput })
      });
      setMessageInput('');
      fetchGreetingsFromAPI();
    } catch (err) {
      console.error('Failed to add greeting:', err);
    }
  };

  useEffect(() => {
    fetchGreetingsFromAPI();
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Cloudflare Hello World</h1>
        <p>React app with D1 Database</p>
      </header>
      
      <main className="main-content">
        <section className="greeting-form-section">
          <h2>Add a Greeting</h2>
          <form onSubmit={submitNewGreeting} className="greeting-form">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Enter your greeting..."
              className="greeting-input"
            />
            <button type="submit" className="submit-button">
              Submit Greeting
            </button>
          </form>
        </section>

        <section className="greetings-list-section">
          <h2>Greetings from D1 Database</h2>
          {isLoadingData ? (
            <p>Loading greetings...</p>
          ) : greetingsList.length === 0 ? (
            <p>No greetings yet. Be the first to add one!</p>
          ) : (
            <ul className="greetings-list">
              {greetingsList.map((greeting) => (
                <li key={greeting.id} className="greeting-item">
                  <span className="greeting-message">{greeting.message}</span>
                  <span className="greeting-timestamp">
                    {new Date(greeting.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
