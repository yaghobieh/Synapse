import React, { useState } from 'react';
import { useSelector, useDispatch } from '../../hooks';
import {
  selectFilteredTodos,
  selectTodosFilter,
  selectTodosStats,
  addTodo,
  toggleTodo,
  deleteTodo,
  editTodo,
  setFilter,
  clearCompleted
} from '../store/slices/todos.slice';

export function TodoApp() {
  const todos = useSelector(selectFilteredTodos);
  const filter = useSelector(selectTodosFilter);
  const stats = useSelector(selectTodosStats);
  const dispatch = useDispatch();

  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      dispatch(addTodo(newTodo.trim()));
      setNewTodo('');
    }
  };

  const handleToggleTodo = (id: number) => {
    dispatch(toggleTodo(id));
  };

  const handleDeleteTodo = (id: number) => {
    dispatch(deleteTodo(id));
  };

  const handleStartEdit = (id: number, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const handleSaveEdit = () => {
    if (editingId && editingText.trim()) {
      dispatch(editTodo({ id: editingId, text: editingText.trim() }));
    }
    setEditingId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleFilterChange = (newFilter: 'all' | 'active' | 'completed') => {
    dispatch(setFilter(newFilter));
  };

  const handleClearCompleted = () => {
    dispatch(clearCompleted());
  };

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #10B981',
      borderRadius: '8px',
      backgroundColor: '#FAFAFA'
    }}>
      <h2>Todo App Demo</h2>

      {/* Add Todo Form */}
      <form onSubmit={handleAddTodo} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <button
            type="submit"
            disabled={!newTodo.trim()}
            style={buttonStyle}
          >
            Add Todo
          </button>
        </div>
      </form>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {(['all', 'active', 'completed'] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => handleFilterChange(filterType)}
            style={{
              ...filterButtonStyle,
              backgroundColor: filter === filterType ? '#10B981' : '#E5E7EB',
              color: filter === filterType ? 'white' : '#374151'
            }}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)} ({stats[filterType]})
          </button>
        ))}
      </div>

      {/* Todo List */}
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        border: '1px solid #E5E7EB',
        borderRadius: '6px'
      }}>
        {todos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
            {filter === 'all' ? 'No todos yet. Add one above!' :
             filter === 'active' ? 'No active todos!' :
             'No completed todos!'}
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                borderBottom: '1px solid #E5E7EB',
                backgroundColor: todo.completed ? '#F9FAFB' : 'white',
                opacity: todo.completed ? 0.7 : 1
              }}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleTodo(todo.id)}
                style={{
                  marginRight: '12px',
                  width: '16px',
                  height: '16px'
                }}
              />

              {editingId === todo.id ? (
                <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    style={{
                      flex: 1,
                      padding: '6px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px'
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEdit}
                    style={{ ...smallButtonStyle, backgroundColor: '#10B981' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{ ...smallButtonStyle, backgroundColor: '#6B7280' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span
                    style={{
                      flex: 1,
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      color: todo.completed ? '#6B7280' : '#111827',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleStartEdit(todo.id, todo.text)}
                  >
                    {todo.text}
                  </span>

                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => handleStartEdit(todo.id, todo.text)}
                      style={{ ...smallButtonStyle, backgroundColor: '#3B82F6' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      style={{ ...smallButtonStyle, backgroundColor: '#EF4444' }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stats and Actions */}
      <div style={{
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        backgroundColor: '#F3F4F6',
        borderRadius: '4px'
      }}>
        <div style={{ fontSize: '14px', color: '#374151' }}>
          {stats.total} total, {stats.active} active, {stats.completed} completed
        </div>

        {stats.completed > 0 && (
          <button
            onClick={handleClearCompleted}
            style={{ ...smallButtonStyle, backgroundColor: '#EF4444' }}
          >
            Clear Completed
          </button>
        )}
      </div>

      {/* Info */}
      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#F3F4F6',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <strong>Todo Features:</strong>
        <br />• Add, edit, delete todos
        <br />• Toggle completion status
        <br />• Filter by status (all/active/completed)
        <br />• Clear completed todos
        <br />• Persistent state management
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#10B981',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
  transition: 'background-color 0.2s',
};

const filterButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  border: 'none',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 'bold',
  transition: 'all 0.2s',
};

const smallButtonStyle: React.CSSProperties = {
  padding: '4px 8px',
  backgroundColor: '#6B7280',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 'bold',
  transition: 'background-color 0.2s',
};
