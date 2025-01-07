import { Container, Flex } from '@radix-ui/themes';
import React, { useState } from 'react';
import { displayXchgBalance } from './utils';

type ProfileWithdrawDialogProps = {
    totalCoins: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: string) => void;
};

const ProfileWithdrawDialog: React.FC<ProfileWithdrawDialogProps> = ({ totalCoins, isOpen, onClose, onSubmit }) => {
    const [amountValue, setAmountValue] = useState('');

    const [balance, setBalance] = useState(0);
    const [lastIsOpen, setLastIsOpen] = useState(false);

    const loadTotalCoins = async () => {
        let balanceAsNumber = parseFloat(totalCoins);
        setBalance(balanceAsNumber);
    }

    if (isOpen && !lastIsOpen) {
        setLastIsOpen(true);
        loadTotalCoins();
    }

    if (!isOpen && lastIsOpen) {
        setLastIsOpen(false);
        return null;
    }


    if (!isOpen) return null;

    const handleMax = () => {
        setAmountValue((balance / 1000000000).toString());
    }

    const handleHalf = () => {
        setAmountValue((balance / 1000000000 / 2).toString());
    }


    const handleOK = () => {
        let amountValueNum = parseFloat(amountValue);
        if (isNaN(amountValueNum)) {
            alert('Invalid amount');
            return;
        }
        let amountValueStr = (amountValueNum * 1000000000).toString();
        onSubmit(amountValueStr);
        setAmountValue('0');
        onClose();
    };

    const handleCancel = () => {
        setAmountValue('0');
        onClose();
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.dialog}>
                <h3> Profile Withdraw </h3>
                <Flex style={{}}>Balance: {displayXchgBalance(balance.toString())} </Flex>
                <input
                    type="text"
                    placeholder='Amount'
                    value={amountValue}
                    onChange={(e) => setAmountValue(e.target.value)}
                    style={styles.input}
                />
                <Flex direction='row'>
                    <Container flexGrow='0' onClick={handleMax} style={styles.minmaxButton}>
                        MAX
                    </Container>
                    <Container flexGrow='0' onClick={handleHalf} style={styles.minmaxButton}>
                        HALF
                    </Container>
                </Flex>

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
    button: {
        fontFamily: 'Roboto Mono',
        margin: '3px',
        padding: '3px',
        border: '1px solid #777',
        borderRadius: '5px',
        cursor: 'pointer',
        backgroundColor: '#333',
        color: '#fff',
        width: '100px',
    },

    minmaxButton: {
        fontFamily: 'Roboto Mono',
        fontSize: '10pt',
        margin: '0px',
        padding: '3px',
        cursor: 'pointer',
        color: '#0AF',
        width: '50px',
    },

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
};

export default ProfileWithdrawDialog;
