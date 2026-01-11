import React, { useState } from 'react';
import { useQuery, useMutation, useLazyQuery, useDispatch } from '../../hooks';
import { createApiAction } from '../../core';

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

export function ApiExample() {
  const dispatch = useDispatch();
  const [postId, setPostId] = useState<number>(1);

  // Automatic query (loads on mount)
  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts
  } = useQuery<Post[]>({
    url: '/posts',
    method: 'GET',
    enabled: true,
  });

  // Lazy query (manual trigger)
  const [fetchPost, {
    data: singlePost,
    isLoading: postLoading,
    error: postError
  }] = useLazyQuery<Post>({
    url: `/posts/${postId}`,
    method: 'GET',
  });

  // Mutation for creating posts
  const { mutate: createPost, isLoading: createLoading } = useMutation<Post, Omit<Post, 'id'>>({
    url: '/posts',
    method: 'POST',
    onSuccess: (data) => {
      console.log('Post created:', data);
      alert(`Post created with ID: ${data.id}`);
    },
    onError: (error) => {
      console.error('Error creating post:', error);
      alert('Error creating post');
    }
  });

  const [newPost, setNewPost] = useState({ title: '', body: '', userId: 1 });

  const handleFetchPost = () => {
    fetchPost();
  };

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.body.trim()) {
      alert('Please fill in title and body');
      return;
    }
    createPost(newPost);
    setNewPost({ title: '', body: '', userId: 1 });
  };

  const handleApiAction = () => {
    // Direct API action dispatch
    const action = createApiAction(
      'api/fetchPost',
      {
        url: '/posts/1',
        method: 'GET'
      }
    );

    dispatch(action);
  };

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #8B5CF6',
      borderRadius: '8px',
      backgroundColor: '#FAFAFA'
    }}>
      <h2>API Integration Demo</h2>

      {/* Automatic Query Example */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Automatic Query (useQuery)</h3>
        <button
          onClick={refetchPosts}
          disabled={postsLoading}
          style={buttonStyle}
        >
          {postsLoading ? 'Loading...' : 'Refetch Posts'}
        </button>

        {postsError && (
          <div style={{ color: '#EF4444', marginTop: '10px' }}>
            Error: {postsError.message}
          </div>
        )}

        <div style={{
          marginTop: '10px',
          maxHeight: '200px',
          overflowY: 'auto',
          border: '1px solid #E5E7EB',
          borderRadius: '4px'
        }}>
          {postsLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>Loading posts...</div>
          ) : posts && posts.length > 0 ? (
            posts.slice(0, 5).map((post) => (
              <div key={post.id} style={{
                padding: '10px',
                borderBottom: '1px solid #E5E7EB',
                backgroundColor: 'white'
              }}>
                <strong>{post.title}</strong>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#6B7280' }}>
                  {post.body.substring(0, 100)}...
                </p>
              </div>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
              No posts loaded
            </div>
          )}
        </div>
      </div>

      {/* Lazy Query Example */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Lazy Query (useLazyQuery)</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="number"
            value={postId}
            onChange={(e) => setPostId(Number(e.target.value))}
            min="1"
            max="100"
            style={{
              padding: '8px',
              border: '1px solid #D1D5DB',
              borderRadius: '4px',
              width: '80px'
            }}
          />
          <button
            onClick={handleFetchPost}
            disabled={postLoading}
            style={buttonStyle}
          >
            {postLoading ? 'Loading...' : `Fetch Post ${postId}`}
          </button>
        </div>

        {postError && (
          <div style={{ color: '#EF4444', marginBottom: '10px' }}>
            Error: {postError.message}
          </div>
        )}

        {singlePost && (
          <div style={{
            padding: '15px',
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px'
          }}>
            <h4>{singlePost.title}</h4>
            <p style={{ margin: '10px 0', color: '#374151' }}>{singlePost.body}</p>
            <small style={{ color: '#6B7280' }}>User ID: {singlePost.userId}</small>
          </div>
        )}
      </div>

      {/* Mutation Example */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Mutation (useMutation)</h3>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Post title"
            value={newPost.title}
            onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
            style={{ ...inputStyle, marginBottom: '8px', width: '100%' }}
          />
          <textarea
            placeholder="Post body"
            value={newPost.body}
            onChange={(e) => setNewPost(prev => ({ ...prev, body: e.target.value }))}
            rows={3}
            style={{ ...inputStyle, marginBottom: '8px', width: '100%', resize: 'vertical' }}
          />
          <input
            type="number"
            placeholder="User ID"
            value={newPost.userId}
            onChange={(e) => setNewPost(prev => ({ ...prev, userId: Number(e.target.value) }))}
            style={{ ...inputStyle, width: '100px' }}
          />
        </div>

        <button
          onClick={handleCreatePost}
          disabled={createLoading}
          style={buttonStyle}
        >
          {createLoading ? 'Creating...' : 'Create Post'}
        </button>
      </div>

      {/* Direct API Action */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Direct API Action</h3>
        <button
          onClick={handleApiAction}
          style={buttonStyle}
        >
          Dispatch API Action
        </button>
        <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '5px' }}>
          Check console for middleware logs
        </p>
      </div>

      {/* Info */}
      <div style={{
        padding: '15px',
        backgroundColor: '#F3F4F6',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <strong>API Features:</strong>
        <br />• <strong>useQuery:</strong> Automatic data fetching with {`{ data, isLoading, error, refetch }`}
        <br />• <strong>useLazyQuery:</strong> Manual trigger for data fetching
        <br />• <strong>useMutation:</strong> Create/update/delete operations
        <br />• <strong>createApiAction:</strong> Direct API action dispatch
        <br />• <strong>API Middleware:</strong> Automatic REQUEST/SUCCESS/FAILURE actions
        <br />• <strong>Configurable:</strong> Base URL, headers, timeout, retry logic
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#8B5CF6',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
  transition: 'background-color 0.2s',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: '4px',
  fontSize: '14px',
};
