import React, { useState } from 'react';

type EditFavoriteXchgAddressDialogProps = {
  currentName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, group: string, description: string) => void;
};

const EditFavoriteXchgAddressDialog: React.FC<EditFavoriteXchgAddressDialogProps> = ({ currentName, isOpen, onClose, onSubmit }) => {
  const [nameValue, setNameValue] = useState('');
  const [groupValue, setGroupValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [lastIsOpen, setLastIsOpen] = useState(false);

  console.log('EditFavoriteXchgAddressDialog', currentName);

  if (isOpen && !lastIsOpen) {
    setLastIsOpen(true);
    // async set name with timout
    setTimeout(() => {
      setNameValue(currentName);
    }, 10);
  }

  if (!isOpen && lastIsOpen) {
    setLastIsOpen(false);
    return null;
  }


  if (!isOpen) return null;

  const handleOK = () => {
    onSubmit(nameValue, groupValue, descriptionValue);
    setNameValue('');
    setGroupValue('');
    setDescriptionValue('');
    onClose();
  };

  const handleCancel = () => {
    setNameValue('');
    setGroupValue('');
    setDescriptionValue('');
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <h3> Favorite XCHG Address </h3>
        <input
          type="text"
          placeholder='Name'
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          style={styles.input}
        />
        <div style={styles.buttons}>
          <button onClick={handleOK} style={styles.button}>
            OK
          </button>
          <button onClick={handleCancel} style={styles.button}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Example styles
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: '#333',
    padding: '20px',
    borderRadius: '5px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    width: '500px',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '20px',
    border: '1px solid #ccc',
    borderRadius: '5px',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'end',
  },
  button: {
    margin: '0 10px',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#007BFF',
    color: '#fff',
    width: '100px',
  },
};

export default EditFavoriteXchgAddressDialog;
