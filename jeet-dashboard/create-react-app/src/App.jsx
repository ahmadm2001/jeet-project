import { useEffect, useState } from 'react';

function App() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedMinutes, setSelectedMinutes] = useState(15);
  const [timers, setTimers] = useState({});

  useEffect(() => {
    fetch('http://localhost:4000/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          if (updated[id] > 0) {
            updated[id]--;
          } else if (updated[id] === 0 && navigator.vibrate) {
            navigator.vibrate(500);
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const approveOrder = async () => {
    if (!selectedOrder) return;
    const res = await fetch(`http://localhost:4000/orders/${selectedOrder.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'accepted',
        preparation_minutes: selectedMinutes
      })
    });

    if (res.ok) {
      alert('הזמנה אושרה!');
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'accepted', preparation_minutes: selectedMinutes } : o));
      setTimers(prev => ({ ...prev, [selectedOrder.id]: selectedMinutes * 60 }));
      setSelectedOrder(null);
    } else {
      alert('שגיאה באישור ההזמנה');
    }
  };

  const rejectOrder = async (orderId) => {
    const res = await fetch(`http://localhost:4000/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' })
    });

    if (res.ok) {
      alert('הזמנה נדחתה');
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } else {
      alert('שגיאה בדחיית ההזמנה');
    }
  };

  const markReady = async (orderId) => {
    const res = await fetch(`http://localhost:4000/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ready_for_pickup' })
    });

    if (res.ok) {
      alert('הזמנה סומנה כמוכנה');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ready_for_pickup' } : o));
    } else {
      alert('שגיאה בעדכון ההזמנה');
    }
  };

  const timeOptions = [];
  for (let i = 5; i <= 55; i += 5) {
    timeOptions.push(i);
  }

  const groupedOrders = {
    placed: orders.filter(o => o.status === 'placed'),
    accepted: orders.filter(o => o.status === 'accepted'),
    ready: orders.filter(o => o.status === 'ready_for_pickup'),
    delivered: orders.filter(o => o.status === 'delivered'),
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const OrderCard = ({ order }) => {
    const timer = timers[order.id] || 0;
    const isExpired = order.status === 'accepted' && timer === 0;
    const borderColor = isExpired ? '#ff4d4d' : '#00cc66';

    return (
      <div style={{
        border: `2px solid ${borderColor}`,
        marginBottom: '15px',
        padding: '10px',
        borderRadius: '10px',
        backgroundColor: '#fff'
      }}>
        <p><strong>הזמנה מספר:</strong> {order.id}</p>
        <p><strong>סכום לתשלום:</strong> ₪{order.total_price}</p>
        {order.status === 'placed' && (
          <>
            <button onClick={() => setSelectedOrder(order)}>אשר הזמנה</button>
            <button onClick={() => rejectOrder(order.id)} style={{ marginLeft: '10px', backgroundColor: '#ffdddd' }}>
              דחה הזמנה
            </button>
          </>
        )}
        {order.status === 'accepted' && (
          <>
            <p>זמן נותר: {formatTimer(timer)}</p>
            <button onClick={() => markReady(order.id)}>סמן כמוכן</button>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', padding: '10px 30px', fontFamily: 'Arial', direction: 'rtl' }}>
      <div style={{ border: '2px solid #ccc', padding: '10px', borderRadius: '10px' }}>
        <h2>הזמנות ממתינות</h2>
        {groupedOrders.placed.map(order => <OrderCard key={order.id} order={order} />)}
      </div>
      <div style={{ border: '2px solid #ccc', padding: '10px', borderRadius: '10px' }}>
        <h2>בהכנה</h2>
        {groupedOrders.accepted.map(order => <OrderCard key={order.id} order={order} />)}
      </div>
      <div style={{ border: '2px solid #ccc', padding: '10px', borderRadius: '10px' }}>
        <h2>מוכנות</h2>
        {groupedOrders.ready.map(order => <OrderCard key={order.id} order={order} />)}
      </div>
      <div style={{ border: '2px solid #ccc', padding: '10px', borderRadius: '10px' }}>
        <h2>נמסרו</h2>
        {groupedOrders.delivered.map(order => <OrderCard key={order.id} order={order} />)}
      </div>

      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff',
          padding: '30px',
          border: '1px solid #aaa',
          boxShadow: '0 0 15px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          <h3>אישור הזמנה #{selectedOrder.id}</h3>
          <label>בחר זמן הכנה (בדקות): </label>
          <select
            value={selectedMinutes}
            onChange={e => setSelectedMinutes(Number(e.target.value))}
          >
            {timeOptions.map(min => (
              <option key={min} value={min}>{min} דקות</option>
            ))}
          </select>
          <br /><br />
          <button onClick={approveOrder}>אשר</button>
          <button onClick={() => setSelectedOrder(null)} style={{ marginLeft: '10px' }}>ביטול</button>
        </div>
      )}
    </div>
  );
}

export default App;
