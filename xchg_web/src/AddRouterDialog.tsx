import React, { useState } from 'react';

type AddRouterDialogProps = {
  xchgAddr: string;
  segment: string;
  name: string;
  ipAddr: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (xchgAddr: string, segment: string, name: string, ipAddr: string) => void;
};

const AddRouterDialog: React.FC<AddRouterDialogProps> = ({ xchgAddr, segment, name, ipAddr, isOpen, onClose, onSubmit }) => {
  const [xchgAddrValue, setXchgAddrValue] = useState('');
  const [segmentValue, setSegmentValue] = useState('');
  const [nameValue, setNameValue] = useState('');
  const [ipAddrValue, setIpAddrValue] = useState('');
  const [lastIsOpen, setLastIsOpen] = useState(false);

  if (isOpen && !lastIsOpen) {
    setLastIsOpen(true);
    setTimeout(() => {
      setXchgAddrValue(xchgAddr);
      setSegmentValue(segment);
      setNameValue(name);
      setIpAddrValue(ipAddr);
    }, 10);
  }

  if (!isOpen && lastIsOpen) {
    setLastIsOpen(false);
    return null;
  }

  if (!isOpen) return null;

  const xchgAddrReadOnly = xchgAddr !== '';

  const handleOK = () => {
    onSubmit(xchgAddrValue, segmentValue, nameValue, ipAddrValue);
    setSegmentValue('');
    setNameValue('');
    setIpAddrValue('');
    onClose();
  };

  const handleCancel = () => {
    setSegmentValue('');
    setNameValue('');
    setIpAddrValue('');
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        {
          xchgAddr === '' ? <h3>Add Router</h3> : <h3>Edit Router</h3>
        }
        <input
          type="text"
          placeholder='XCHG address'
          value={xchgAddrValue}
          onChange={(e) => setXchgAddrValue(e.target.value)}
          style={styles.input}
          readOnly={xchgAddrReadOnly}
        />
        <input
          type="text"
          placeholder='Segment'
          value={segmentValue}
          onChange={(e) => setSegmentValue(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder='Name'
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder='IP Address'
          value={ipAddrValue}
          onChange={(e) => setIpAddrValue(e.target.value)}
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

export default AddRouterDialog;
