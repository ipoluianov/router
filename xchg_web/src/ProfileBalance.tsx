import { Button, Flex } from "@radix-ui/themes";
import type { WalletAccount } from '@mysten/wallet-standard';

export function Profile(
    { currentAccount, }: { currentAccount: WalletAccount }
) {
    return (                        <Flex direction='column'>
        <Flex direction='row' style={{ backgroundColor: '#333' }}>
            <Flex style={{ fontSize: '24pt' }}>BALANCE</Flex>
            <Flex flexGrow='1'></Flex>
            <Button onClick={() => profileDepositDialog()}>DEPOSIT</Button>
        </Flex>
        <Flex direction='row' style={{ backgroundColor: '#333' }}>
            <Flex style={{ fontSize: '24pt' }}>{displayXchgBalance(profileState.balance)} bytes</Flex>
            <Flex flexGrow='1'></Flex>
            <Button onClick={() => profileWithdrawDialog()}>WITHDRAW</Button>
        </Flex>
    </Flex>
);
}
