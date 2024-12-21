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
import { TB_TYPE, TESTNET_COUNTER_FUND_ID } from "./constants";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { makeError } from "./error";
import type { WalletAccount } from '@mysten/wallet-standard';

export function Profile() {

    const currentAccount = useCurrentAccount();

    const counterPackageId = useNetworkVariable("counterPackageId");
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isWaitingForTransaction, setIsWaitingForTransaction] = useState(false);

    const [textToSet, setTextToSet] = useState("");

    interface XchgAddrObject {
        balance : string,
        ownerSuiAddr: string,
    }

    interface FavotiveXchgAddress {
        name: string,
        group: string,
        description: string,
        xchgAddr: string,
        xchgAddrObject: XchgAddrObject,
    }

    let defaultProfileState: ProfileState = {
        balance: "",
        favoriteXchgAddresses: [],
        own_routers: [],
        sponsoredXchgAddresses: [],
    }

    const [profileState, setProfileState] = useState(defaultProfileState);

    const [waitingForTxn, setWaitingForTxn] = useState("");

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

    const getAddressesTableId = async () => {
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
        return fields.addresses.fields.id.id;
    }

    interface ProfileState {
        balance: string,
        favoriteXchgAddresses: FavotiveXchgAddress[],
        own_routers: string[],
        sponsoredXchgAddresses: string[],
    }

    const getXchgAddressObject = async (xchgAddr: string) => {
        let xchgAddressesTableId = await getAddressesTableId();
        const resultGetXchgAddr = await suiClient.getDynamicFieldObject(
            {
                parentId: xchgAddressesTableId,
                name: {
                    type: "address",
                    value: xchgAddr
                }
            }
        );
        console.log("Xchg Address Object: ", resultGetXchgAddr);

        if (resultGetXchgAddr.data == null) {
            console.log("Xchg Address Object not found");
            return;
        }

        let fields = getObjectFields(resultGetXchgAddr.data);
        fields = fields.value.fields;
        console.log("Xchg Address Fields: ", fields);

        let xcgfAddrObject: XchgAddrObject = {
            balance: fields.balance,
            ownerSuiAddr: fields.ownerSuiAddr,
        }

        return xcgfAddrObject;
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

        let state: ProfileState = {
            balance: fields.balance,
            favoriteXchgAddresses: [],
            own_routers: [],
            sponsoredXchgAddresses: [],
        }

        for (let i = 0; i < fields.favoriteXchgAddresses.length; i++) {
            let item = fields.favoriteXchgAddresses[i];
            let favItem: FavotiveXchgAddress = {
                name: item.fields.name,
                group: item.fields.group,
                description: item.fields.description,
                xchgAddr: item.fields.xchgAddr,
            }
            let xchgAddressObject = await getXchgAddressObject(item.fields.xchgAddr);
            favItem.xchgAddrObject = xchgAddressObject;

            state.favoriteXchgAddresses.push(favItem);
        }

        console.log("State", state);

        //let favoriteXchgAddresses = fields.value.fields.favoriteXchgAddresses.fields;
        //console.log("Favorite Xchg Addresses: ", favoriteXchgAddresses);

        setProfileState(state);
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

    const createRouter = async () => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();

        const coin = await prepareCoin(currentAccount, tx, TB_TYPE, 10000000000n);
        console.log('coin', coin);
        // if coin is a DError
        if ('errorMessage' in coin) {
            alert('Error: ' + coin.errorMessage);
            return;
        }

        tx.moveCall({
            arguments: [tx.object(TESTNET_COUNTER_FUND_ID), coin],
            target: `${counterPackageId}::fund::create_router_account`,
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

    const depositToProfile = async () => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();

        const coin = await prepareCoin(currentAccount, tx, TB_TYPE, 10000000000n);
        console.log('coin', coin);
        // if coin is a DError
        if ('errorMessage' in coin) {
            alert('Error: ' + coin.errorMessage);
            return;
        }

        tx.moveCall({
            arguments: [tx.object(TESTNET_COUNTER_FUND_ID), coin],
            target: `${counterPackageId}::fund::depositToProfile`,
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

    const depositToXchgAddress = async () => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();

        const coin = await prepareCoin(currentAccount, tx, TB_TYPE, 10000000000n);
        console.log('coin', coin);
        // if coin is a DError
        if ('errorMessage' in coin) {
            alert('Error: ' + coin.errorMessage);
            return;
        }

        let xchgAddr = "0x5ded23a41eb84ec1f95b27d14222155f145a45e76a6377ae9cfcf754a4da9956"

        tx.moveCall({
            arguments: [tx.object(TESTNET_COUNTER_FUND_ID), tx.pure.address(xchgAddr), coin],
            target: `${counterPackageId}::fund::depositToXchgAddr`,
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

    const removeStake = async () => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();
        tx.moveCall({
            arguments: [tx.object(TESTNET_COUNTER_FUND_ID), tx.pure.u64(50)],
            target: `${counterPackageId}::fund::withdrawFromProfile`,
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

    const addFavoriteXchgAddress = async () => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();

        let xchgAddr = "0x000102030405060708090A0B0C0D0E0F000102030405060708090A0B0C0D0E0F"

        tx.moveCall({
            arguments: [
                tx.object(TESTNET_COUNTER_FUND_ID), 
                tx.pure.address(xchgAddr), 
                tx.pure.string("name"),
                tx.pure.string("group"),
                tx.pure.string("description"),
            ],
            target: `${counterPackageId}::fund::addFavoriteXchgAddress`,
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



    let isDisabled = false;
    if (isWaitingForTransaction) {
        isDisabled = true;
    }

    return (
        <>
            <hr style={{ marginTop: '20px' }} />
            <h1>PROFILE</h1>

            <Flex direction="column" gap="2">
                <Flex direction="column" gap="2">
                    <Flex direction="column">
                        <Flex direction="row">
                            <Button
                                style={{ margin: '12px' }}
                                onClick={() => create_profile()}
                                disabled={waitingForTxn !== ""}
                            >
                                CREATE PROFILE
                            </Button>
                        </Flex>
                        <Flex direction="row">
                            <Button
                                style={{ margin: '12px' }}
                                onClick={() => depositToProfile()}
                                disabled={waitingForTxn !== ""}
                            > DEPOSIT TO PROFILE
                            </Button>
                            <Button
                                style={{ margin: '12px' }}
                                onClick={() => depositToXchgAddress()}
                                disabled={waitingForTxn !== ""}
                            > DEPOSIT TO ADDRESS
                            </Button>
                            <Button
                                style={{ margin: '12px' }}
                                onClick={() => removeStake()}
                                disabled={waitingForTxn !== ""}
                            > REMOVE STAKE
                            </Button>
                        </Flex>
                        <Flex direction="row">
                            <Button
                                style={{ margin: '12px' }}
                                onClick={() => addFavoriteXchgAddress()}
                                disabled={waitingForTxn !== ""}
                            > ADD TO FAVORITES
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
                        Balance : {profileState.balance}
                    </Flex>
                    <Flex>
                        Favorite Xchg Addresses:
                        <Flex direction="column">
                            {profileState.favoriteXchgAddresses.map((item, index) => (
                                <Flex key={index}>
                                    <Flex>{item.name} - {item.group} - {item.description} - {shortAddress(item.xchgAddr)} - {item.xchgAddrObject.balance} - {shortAddress(item.xchgAddrObject.ownerSuiAddr)}</Flex>
                                </Flex>
                            ))}
                        </Flex>
                    </Flex>

                </Flex>
            </Flex>
        </>
    );
}
