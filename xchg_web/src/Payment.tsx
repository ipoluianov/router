import {
    useSignAndExecuteTransaction,
    useSuiClient,
} from "@mysten/dapp-kit";
import type { SuiObjectData, GetDynamicFieldObjectParams } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Flex, Heading } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { shortAddress } from "./utils";
import { decryptMessage, encryptMessage } from "./aes";
import { TESTNET_COUNTER_FUND_ID } from "./constants";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { makeError } from "./error";
import type { WalletAccount } from '@mysten/wallet-standard';



export function Payment() {

    const currentAccount = useCurrentAccount();

    const counterPackageId = useNetworkVariable("counterPackageId");
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isWaitingForTransaction, setIsWaitingForTransaction] = useState(false);

    const [textToSet, setTextToSet] = useState("");

    const [waitingForTxn, setWaitingForTxn] = useState("");

    const TB_TYPE = '0x79e972d497be7e3e4571693f428dcb1d49bd576c99f32dbe992c35284a83a7bf::tb::TB';
	const prepareCoin = async (account: WalletAccount, tx: Transaction, coinType: string, amount: bigint): (Promise<TransactionResult | DError>) => {
		if (!account) {
			return makeError("No account");
		}

		const coinTypeParts = coinType.split('::');
		if (coinTypeParts.length !== 3) {
			return makeError("Invalid coin type");
		}

		const coinSymbol = coinType.split('::')[2];

		const { data: coins } = await suiClient.getCoins({
			owner: account.address,
			coinType: coinType,
		});

		if (coins.length === 0) {
			return makeError("No " + coinSymbol + " found");
		}

		let totalBalance = 0n;
		for (let i = 0; i < coins.length; i++) {
			let balanceAsBitInt = BigInt(coins[i].balance);
			totalBalance += balanceAsBitInt;
		}

		//let totalBalanceAsFloat = parseFloat(totalBalance.toString()) / 1000000000;
		if (BigInt(totalBalance) < amount) {
			console.log('Not enough balance');
			return makeError("Not enough " + coinSymbol + " balance");
		}

		console.log('Coins found', coins);

		// Try to find a coin with enough amount
		let coinWithEnoughAmount = coins.find((coin) => BigInt(coin.balance) >= BigInt(amount));
		if (coinWithEnoughAmount) {
			const coin = tx.splitCoins(coinWithEnoughAmount.coinObjectId, [amount]);
			return coin;
		}

		// Merge all coins into the first coin
		let coinsIDs = coins.map((coin) => coin.coinObjectId);
		let coinsIDsFromSecondItem = coinsIDs.slice(1);
		tx.mergeCoins(coins[0].coinObjectId, coinsIDsFromSecondItem);
		const coin = tx.splitCoins(coins[0].coinObjectId, [amount]);
		return coin;
	}

    // TableID: "0x0de187b0dcbc036bd3b0d6ae8a115b3e7e36d8cb9a8cb2ac95d92733fd01a9c5"

    const gettest1 = async () => {
        let id = TESTNET_COUNTER_FUND_ID;
        const result = await suiClient.getObject({
            id,
            options: {
                showContent: true,
                showOwner: true,
            },
        });
        console.log("Data: ", result);
    }

    const gettest = async () => {
        let id = "0xb9fa83a586fa8897a303886d40ff2d78245c30d03d86d190aab09bf747183132";
        const result = await suiClient.getDynamicFieldObject(
            {
                parentId: id,
                name: {
                    type: "address",
                    value: "0x000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f"
                }
            }
        );
        //let p = GetDynamicFieldObjectParams{};
        // parentId
        // 
        console.log("Data: ", result);
    }


	const payment = async () => {
		if (!currentAccount) {
			return;
		}

		const tx = new Transaction();

		const coin = await prepareCoin(currentAccount, tx, TB_TYPE, 2000000000n);
		console.log('coin', coin);
		// if coin is a DError
		if ('errorMessage' in coin) {
			alert('Error: ' + coin.errorMessage);
			return;
		}

		let refAddress = currentAccount.address;

        let xchgAddr = tx.pure.vector('u8', [0x01, 1, 2 ,3, 4, 5 ,6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2 ,3, 4, 5 ,6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
        

		tx.moveCall({
			arguments: [tx.object(TESTNET_COUNTER_FUND_ID), xchgAddr, coin],
			target: `${counterPackageId}::fund::receive_payment`,
		});

		signAndExecute(
			{
				transaction: tx,
			},
			{
				onSuccess: async ({ digest }) => {
					const { effects } = await suiClient.waitForTransaction({
						digest: digest,
						options: {
							showEffects: true,
							showRawEffects: true,
						},
					});

					alert("OK");
				},
				onError: (error) => {
					alert("Error: " + error);
				}

			},
		);
	}

    let isDisabled = false;
    if (isWaitingForTransaction) {
        isDisabled = true;
    }

    return (
        <>
            <hr style={{ marginTop: '20px' }} />
            <h1>USER ACCOUNT</h1>

            <Flex direction="column" gap="2">
                <Flex direction="column" gap="2">
                    <textarea disabled={isDisabled}
                        value={textToSet}
                        onChange={(e) => setTextToSet(e.target.value)} placeholder="Note content"
                        style={{ width: '100%', height: '300px' }}
                    />
                    <Flex direction="row">
                        <Button
                            style={{ marginRight: '12px' }}
                            onClick={() => payment()}
                            disabled={waitingForTxn !== ""}
                        >
                            {waitingForTxn === "set_value" ? (
                                <ClipLoader size={20} />
                            ) : (
                                "PAY"
                            )}
                        </Button>
                        <Button
                            style={{ marginRight: '12px' }}
                            onClick={() => gettest()}
                            disabled={waitingForTxn !== ""}
                        > GET TEST
                        </Button>
                    </Flex>
                </Flex>
            </Flex>
        </>
    );
}
