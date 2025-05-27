import React from 'react';
import { IonSelect, IonSelectOption, IonLabel } from '@ionic/react';

export type SortOption =
  | 'title-asc'
  | 'title-desc'
  | 'date-newest'
  | 'date-oldest'
  | 'color-asc'
  | 'color-desc';

interface SortOptionsProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const SortOptions: React.FC<SortOptionsProps> = ({ value, onChange }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '-3px', marginBottom: '4px',marginLeft:'30px'}}>
      <IonLabel>Sort by:</IonLabel>
      <IonSelect
        value={value}
        placeholder="Select sort"
        onIonChange={(e) => onChange(e.detail.value)}
      >
        <IonSelectOption value="title-asc">Title (A–Z)</IonSelectOption>
        <IonSelectOption value="title-desc">Title (Z–A)</IonSelectOption>
        <IonSelectOption value="date-newest">Date (Newest)</IonSelectOption>
        <IonSelectOption value="date-oldest">Date (Oldest)</IonSelectOption>
        <IonSelectOption value="color-asc">Background Color (A–Z)</IonSelectOption>
        <IonSelectOption value="color-desc">Background Color (Z–A)</IonSelectOption>
      </IonSelect>
    </div>
  );
};

export default SortOptions;
