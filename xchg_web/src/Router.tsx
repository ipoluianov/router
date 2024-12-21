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
import { getObjectFields, shortAddress } from "./utils";
import { decryptMessage, encryptMessage } from "./aes";
import { TESTNET_COUNTER_FUND_ID } from "./constants";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { makeError } from "./error";
import type { WalletAccount } from '@mysten/wallet-standard';

export function Router() {

    const currentAccount = useCurrentAccount();

    const counterPackageId = useNetworkVariable("counterPackageId");
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isWaitingForTransaction, setIsWaitingForTransaction] = useState(false);

    const [textToSet, setTextToSet] = useState("");

    const [routerInfo, setRouterInfo] = useState([]);

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

        let xchgAddr = tx.pure.vector('u8', [0x01, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);


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

    const createRouter = async () => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();

        tx.moveCall({
            arguments: [
                tx.object(TESTNET_COUNTER_FUND_ID),
                tx.pure.u32(2),
                tx.pure.string("name of router"),
                tx.pure.string("192.168.0.1"),
                tx.pure.address("0x5ded23a41eb84ec1f95b27d14222155f145a45e76a6377ae9cfcf754a4da9956"),
            ],
            target: `${counterPackageId}::fund::createRouter`,
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

    const addStake = async (xchgAddr: string) => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();

        tx.moveCall({
            arguments: [
                tx.object(TESTNET_COUNTER_FUND_ID), 
                tx.pure.address(xchgAddr),
                tx.pure.u64(1000),
            ],
            target: `${counterPackageId}::fund::addStake`,
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

    const removeStake = async (xchgAddr: string) => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();
        tx.moveCall({
            arguments: [
                tx.object(TESTNET_COUNTER_FUND_ID), 
                tx.pure.address(xchgAddr),
                tx.pure.u64(100),
            ],
            target: `${counterPackageId}::fund::removeStake`,
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

    const genChequeIDs = async () => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();
        tx.moveCall({
            arguments: [
                tx.object(TESTNET_COUNTER_FUND_ID),
                tx.pure.u32(10),
                tx.object('0x0000000000000000000000000000000000000000000000000000000000000006'),
            ],
            target: `${counterPackageId}::fund::genChequeIDs`,
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

    const getProfilesTableId = async () => {
        let fundId = TESTNET_COUNTER_FUND_ID;
        const resultGetFund = await suiClient.getObject({
            id: fundId,
            options: {
                showContent: true,
                showOwner: true,
            },
        });
        console.log("Fund Object: ", resultGetFund);
        let fields = getObjectFields(resultGetFund.data);
        return fields.profiles.fields.id.id;
    }

    const getRoutersTableId = async () => {
        let fundId = TESTNET_COUNTER_FUND_ID;
        const resultGetFund = await suiClient.getObject({
            id: fundId,
            options: {
                showContent: true,
                showOwner: true,
            },
        });
        console.log("Fund Object: ", resultGetFund);
        let fields = getObjectFields(resultGetFund.data);
        return fields.routers.fields.id.id;
    }

    interface RouterInfo {
        xchgAddr: string;
        segment: string;
        name: string;
        owner: string;
        ipAddr: string;
        totalStakeAmount: bigint;
        rewards: bigint;
    }

    const getRouterObject = async (xchgAddr: string) => {
        let profilesTableId = await getRoutersTableId();
        const resultGetRouter = await suiClient.getDynamicFieldObject(
            {
                parentId: profilesTableId,
                name: {
                    type: "address",
                    value: xchgAddr
                }
            }
        );
        console.log("resultGetRouter: ", resultGetRouter);

        var result: RouterInfo = {
            xchgAddr: xchgAddr,
            segment: resultGetRouter.data?.content.fields.value.fields.segment,
            name: resultGetRouter.data?.content.fields.value.fields.name,
            owner: resultGetRouter.data?.content.fields.value.fields.owner,
            ipAddr: resultGetRouter.data?.content.fields.value.fields.ipAddr,
            totalStakeAmount: resultGetRouter.data?.content.fields.value.fields.totalStakeAmount,
            rewards: resultGetRouter.data?.content.fields.value.fields.rewards,
        }

        return result;
    }


    const getProfileObject = async () => {
        let profilesTableId = await getProfilesTableId();
        const resultGetProfile = await suiClient.getDynamicFieldObject(
            {
                parentId: profilesTableId,
                name: {
                    type: "address",
                    value: currentAccount?.address
                }
            }
        );
        console.log("Profile Object: ", resultGetProfile);

        if (resultGetProfile.data == null) {
            console.log("Profile Object not found");
            return;
        }

        let fields = getObjectFields(resultGetProfile.data);
        fields = fields.value.fields;
        console.log("Profile Fields: ", fields);

        let routers: RouterInfo[] = [];

        for (let i = 0; i < fields.own_routers.length; i++) {
            let item = fields.own_routers[i];
            let routerObj = await getRouterObject(item);
            routers.push(routerObj);
            console.log("Router Item: ", routerObj);
        }

        setRouterInfo(routers);

        //console.log("State", state);

        //let favoriteXchgAddresses = fields.value.fields.favoriteXchgAddresses.fields;
        //console.log("Favorite Xchg Addresses: ", favoriteXchgAddresses);

        //setProfileState(state);
    }

    const create_profile = async () => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();

        tx.moveCall({
            arguments: [tx.object(TESTNET_COUNTER_FUND_ID)],
            target: `${counterPackageId}::fund::create_profile`,
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


    const loadRouterAccount = async () => {
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
        let routersTable = resultGetFund.data?.content?.fields?.routers.fields.id.id;
        console.log("Routers Table: ", routersTable);

        let localAddress = currentAccount?.address;
        console.log("Local Address: ", localAddress);

        let id = routersTable;
        const routerAccount = await suiClient.getDynamicFieldObject(
            {
                parentId: id,
                name: {
                    type: "address",
                    value: localAddress,
                }
            }
        );
        console.log("My Router Account: ", routerAccount);

        let info = {};
        info.balance = routerAccount.data?.content.fields.value.fields.balance;
        info.stake = routerAccount.data?.content.fields.value.fields.stake;
        info.chequeIds = routerAccount.data?.content.fields.value.fields.chequeIds.fields.contents;

        console.log("Parsed: ", info);
        setRouterInfo(info);
    }


    let isDisabled = false;
    if (isWaitingForTransaction) {
        isDisabled = true;
    }

    return (
        <>
            <hr style={{ marginTop: '20px' }} />
            <h1>MY ROUTER</h1>

            <Flex direction="column" gap="2">
                <Flex direction="column" gap="2">
                    <Flex direction="column">
                        <Flex direction="row">
                            <Button
                                style={{ margin: '12px' }}
                                onClick={() => createRouter()}
                                disabled={waitingForTxn !== ""}
                            >
                                CREATE ROUTER ACCOUNT
                            </Button>
                        </Flex>
                        <Flex direction="row">
                            <Button
                                style={{ margin: '12px' }}
                                onClick={() => getProfileObject()}
                                disabled={waitingForTxn !== ""}
                            > GET STATE
                            </Button>
                        </Flex>
                    </Flex>
                    <Flex>
                        ROUTERS ({routerInfo.length})
                    </Flex>
                    <Flex direction='column'>
                        {routerInfo?.map((item) => (
                            <Flex style={{
                                border: '1px solid white',
                                margin: '12px',
                                padding: '12px',
                            }}
                                key={item.xchgAddr} direction='column'>
                                <Flex>ID: {item.xchgAddr}</Flex>
                                <Flex>Segment: {item.segment}</Flex>
                                <Flex>Name: {item.name}</Flex>
                                <Flex>Owner: {item.owner}</Flex>
                                <Flex>IP Address: {item.ipAddr}</Flex>
                                <Flex>Total Stake Amount: {item.totalStakeAmount}</Flex>
                                <Flex>Rewards: {item.rewards}</Flex>
                                <Flex direction="row">
                                    <Button
                                        style={{ margin: '12px' }}
                                        onClick={() => addStake(item.xchgAddr)}
                                        disabled={waitingForTxn !== ""}
                                    > ADD STAKE
                                    </Button>
                                    <Button
                                        style={{ margin: '12px' }}
                                        onClick={() => removeStake(item.xchgAddr)}
                                        disabled={waitingForTxn !== ""}
                                    > REMOVE STAKE
                                    </Button>
                                </Flex>
                                <Flex direction="row">
                                    <Button
                                        style={{ margin: '12px' }}
                                        onClick={() => genChequeIDs()}
                                        disabled={waitingForTxn !== ""}
                                    > GENERATE CHEQUES
                                    </Button>
                                </Flex>

                            </Flex>
                        ))}
                    </Flex>
                </Flex>
            </Flex>
        </>
    );
}
