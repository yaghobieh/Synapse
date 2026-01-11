import React, { useState } from 'react';
import { useSelector, useDispatch } from '../../hooks';
import { store } from '../store/store';
import {
  selectCounterValue,
  selectCounterHistory,
  selectCounterLoading,
  increment,
  decrement,
  incrementByAmount,
  reset,
  setLoading
} from '../store/slices/counter.slice';

export function Counter() {
  const count = useSelector(selectCounterValue);
  const history = useSelector(selectCounterHistory);
  const isLoading = useSelector(selectCounterLoading);
  const dispatch = useDispatch();

  const [incrementAmount, setIncrementAmount] = useState(2);

  const handleIncrement = () => {
    dispatch(increment());
  };

  const handleDecrement = () => {
    dispatch(decrement());
  };

  const handleIncrementByAmount = () => {
    dispatch(incrementByAmount(incrementAmount));
  };

  const handleReset = () => {
    dispatch(reset());
  };

  const handleAsyncIncrement = async () => {
    dispatch(setLoading(true));

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));

    dispatch(increment());
    dispatch(setLoading(false));
  };

  const handleMultiAction = () => {
    // Dispatch multiple actions at once
    (store as any).dispatch([
      increment(),
      increment(),
      increment()
    ]);
  };

  const handleWaitForAction = async () => {
    try {
      console.log('Waiting for increment action...');
      const result = await (store as any).waitFor('counter/increment');
      console.log('Action completed!', result);
    } catch (error) {
      console.error('Timeout waiting for action:', error);
    }
  };

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #7C3AED',
      borderRadius: '8px',
      backgroundColor: '#FAFAFA'
    }}>
      <h2>Counter Demo</h2>

      <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#7C3AED', margin: '20px 0' }}>
        {count}
        {isLoading && <span style={{ fontSize: '24px', color: '#F59E0B' }}>...</span>}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button
          onClick={handleDecrement}
          disabled={isLoading}
          style={buttonStyle}
        >
          -1
        </button>

        <button
          onClick={handleIncrement}
          disabled={isLoading}
          style={buttonStyle}
        >
          +1
        </button>

        <button
          onClick={handleAsyncIncrement}
          disabled={isLoading}
          style={{ ...buttonStyle, backgroundColor: '#F59E0B' }}
        >
          +1 (Async)
        </button>

        <button
          onClick={handleMultiAction}
          disabled={isLoading}
          style={{ ...buttonStyle, backgroundColor: '#10B981' }}
        >
          +3 (Multi)
        </button>

        <button
          onClick={handleReset}
          disabled={isLoading}
          style={{ ...buttonStyle, backgroundColor: '#EF4444' }}
        >
          Reset
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="number"
          value={incrementAmount}
          onChange={(e) => setIncrementAmount(Number(e.target.value))}
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '60px',
            marginRight: '10px'
          }}
        />
        <button
          onClick={handleIncrementByAmount}
          disabled={isLoading}
          style={{ ...buttonStyle, backgroundColor: '#8B5CF6' }}
        >
          +{incrementAmount}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleWaitForAction}
          style={{ ...buttonStyle, backgroundColor: '#06B6D4' }}
        >
          Test waitFor
        </button>
      </div>

      {history.length > 0 && (
        <div>
          <h3>History (last 5):</h3>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {history.slice(-5).map((value, index) => (
              <span
                key={index}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#EDE9FE',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Direct store access examples */}
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#F3F4F6', borderRadius: '4px' }}>
        <h4>Direct Store Access:</h4>
        <button
          onClick={() => {
            store.dispatch(increment());
            console.log('Current state:', store.getState());
          }}
          style={smallButtonStyle}
        >
          store.dispatch()
        </button>
        <button
          onClick={() => console.log('State:', store.getState())}
          style={smallButtonStyle}
        >
          store.getState()
        </button>
        <button
          onClick={() => {
            const unsubscribe = store.subscribe(() => {
              console.log('State changed:', store.getState());
            });
            setTimeout(unsubscribe, 5000); // Unsubscribe after 5s
          }}
          style={smallButtonStyle}
        >
          store.subscribe()
        </button>
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#7C3AED',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
  transition: 'background-color 0.2s',
};

const smallButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  padding: '6px 12px',
  fontSize: '12px',
  marginRight: '5px',
  marginBottom: '5px',
};
