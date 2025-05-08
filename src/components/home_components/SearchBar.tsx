import React, { useState } from 'react';
import { IonSearchbar } from '@ionic/react';

interface SearchbarProps {
  onSearch: (searchTerm: string) => void;
}

function Searchbar({ onSearch }: SearchbarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: CustomEvent) => {
    const term = e.detail.value || '';
    setSearchTerm(term);
    onSearch(term.toLowerCase());
  };

  return (
    <IonSearchbar 
      placeholder="Find Journal"
      value={searchTerm}
      onIonChange={handleSearch}
      debounce={300}
    />
  );
}

export default Searchbar;