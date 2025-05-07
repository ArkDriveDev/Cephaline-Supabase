import React, { useState } from 'react';
import { IonIcon, IonRow, IonCol } from '@ionic/react';
import {
  linkOutline,
  imageOutline,
  documentAttachOutline,
  folderOpenOutline
} from 'ionicons/icons';

const icons = [
  { id: 'link', icon: linkOutline, label: 'Attach Link' },
  { id: 'image', icon: imageOutline, label: 'Attach Image' },
  { id: 'file', icon: documentAttachOutline, label: 'Attach File' },
  { id: 'folder', icon: folderOpenOutline, label: 'Attach Folder' }
];

const Attachments: React.FC = () => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <IonRow style={{ justifyContent: 'flex-start', gap: '1px', padding: '8px' }}>
      {icons.map(({ id, icon, label }) => (
        <IonCol size="auto" key={id}>
          <div
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            style={{ position: 'relative', display: 'inline-block' }}
          >
            <IonIcon
              icon={icon}
              size="large"
              onClick={() => console.log(label)}
              style={{ cursor: 'pointer' }}
            />
            {hovered === id && (
              <div
                style={{
                  position: 'absolute',
                  top: '-40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#333',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  zIndex: 1000,
                  fontSize: '14px'
                }}
              >
                {label}
              </div>
            )}
          </div>
        </IonCol>
      ))}
    </IonRow>
  );
};

export default Attachments;
