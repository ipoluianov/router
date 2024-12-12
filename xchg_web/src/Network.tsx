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

export function Network() {

    const currentAccount = useCurrentAccount();

    const counterPackageId = useNetworkVariable("counterPackageId");
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isWaitingForTransaction, setIsWaitingForTransaction] = useState(false);

    const [textToSet, setTextToSet] = useState("");

    const [networkInfo, setNetworkInfo] = useState({});

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

    const delareService = async () => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();
        tx.moveCall({
            arguments: [
                tx.object(TESTNET_COUNTER_FUND_ID),
                tx.pure.u8(3),
                //tx.pure.vector('u8', [192, 168, 0, 17]),
                tx.pure.string("131231231"),
                tx.object('0x0000000000000000000000000000000000000000000000000000000000000006'),
            ],
            target: `${counterPackageId}::fund::delareService`,
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
                    console.log("Effects: ", effects);
                    alert("OK");
                },
                onError: (error) => {
                    alert("Error: " + error);
                }

            },
        );
    }

    const loadNetwork = async (networkIndex: number) => {
        console.log("Loading router account");
        let fundId = TESTNET_COUNTER_FUND_ID;
        const resultGetFund = await suiClient.getObject({
            id: fundId,
            options: {
                showContent: true,
                showOwner: true,
            },
        });
        console.log("Fund Object: ", resultGetFund);
        let networkTable = resultGetFund.data?.content?.fields?.network.fields.id.id;
        console.log("networkTable Table: ", networkTable);

        let localAddress = currentAccount?.address;
        console.log("Local Address: ", localAddress);

        let id = networkTable;
        const network = await suiClient.getDynamicFieldObject(
            {
                parentId: id,
                name: {
                    type: "u8",
                    value: networkIndex,
                }
            }
        );
        console.log("Network: ", network);

        let networkInfo = [];
        networkInfo.routers = network.data?.content.fields.value.fields.routers;

        console.log("Parsed: ", networkInfo);
        setNetworkInfo(networkInfo);
    }


    let isDisabled = false;
    if (isWaitingForTransaction) {
        isDisabled = true;
    }

    return (
        <>
            <hr style={{ marginTop: '20px' }} />
            <h1>NETWORK</h1>

            <Flex direction="column" gap="2">
                <Flex direction="column" gap="2">
                    <Flex direction="row">
                        <Button
                            style={{ marginRight: '12px' }}
                            onClick={() => delareService()}
                            disabled={waitingForTxn !== ""}
                        > delareService
                        </Button>
                        <Button
                            style={{ marginRight: '12px' }}
                            onClick={() => loadNetwork(3)}
                            disabled={waitingForTxn !== ""}
                        > GET TEST
                        </Button>
                    </Flex>
                    <Flex direction='column'>
                        {networkInfo?.routers?.map((item, index) => (
                            <Flex key={index}>
                                ID: {item.fields.ipAddr}
                                <br />
                            </Flex>
                        ))}

                        ChequeIds:{ }
                    </Flex>

                </Flex>
            </Flex>
        </>
    );
}
