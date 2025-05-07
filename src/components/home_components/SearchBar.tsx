import React from 'react';
import { IonSearchbar } from '@ionic/react';

function Searchbar() {
  return (
    <>
      <IonSearchbar
        placeholder="Find Journal"
        style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 0 8px rgba(6, 6, 6, 0.8)',
          padding: '8px',
          color: 'black',
          '--background': 'white',
          '--color': 'black'
        }}
      />
    </>
  );
}

export default Searchbar;
