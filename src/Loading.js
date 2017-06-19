import React from 'react';
import CircularProgress from 'material-ui/CircularProgress';

export const Loading = () => (
  <div style={{ 
    position: 'fixed',
    width: '100%', 
    height: 'calc(100% - 56px - 64px)', 
  }}>
    <CircularProgress 
      size={80} thickness={7} 
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    />
  </div>
);
