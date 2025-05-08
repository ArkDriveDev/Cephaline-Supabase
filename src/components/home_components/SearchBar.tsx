import React from 'react';
import { IonSearchbar } from '@ionic/react';

interface SearchbarProps {
  value: string;
  onChange: (value: string) => void;
}

function Searchbar({ value, onChange }: SearchbarProps) {
  return (
    <IonSearchbar
      placeholder="Find Journal"
      value={value}
      onIonInput={(e) => onChange(e.detail.value!)}
      debounce={300}
    />
  );
}
export default Searchbar;
