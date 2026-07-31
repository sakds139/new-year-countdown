import { useEffect, useState } from 'react';

function App() {
  const [stats, setStats] = useState({ rooms: 0, occupants: 0, unpaid: 0 });

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => setStats({ rooms: 0, occupants: 0, unpaid: 0 }));
  }, []);

  return (
    <div className="app-shell">
      <header>
        <h1>Dorm Management System</h1>
        <p>Smart control for rooms, tenants, and payments.</p>
      </header>

      <section className="cards">
        <div className="card">
          <h3>Total Rooms</h3>
          <p>{stats.rooms}</p>
        </div>
        <div className="card">
          <h3>Occupants</h3>
          <p>{stats.occupants}</p>
        </div>
        <div className="card">
          <h3>Unpaid Bills</h3>
          <p>{stats.unpaid}</p>
        </div>
      </section>
    </div>
  );
}

export default App;
