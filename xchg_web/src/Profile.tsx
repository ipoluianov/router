import {
    useSignAndExecuteTransaction,
    useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Flex, Table } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useEffect, useState } from "react";
import { getObjectFields, shortAddress } from "./utils";
import { TB_TYPE, TESTNET_COUNTER_FUND_ID } from "./constants";
import { makeError } from "./error";
import type { WalletAccount } from '@mysten/wallet-standard';
import TextInputDialog from "./TextInputDialog";

export function Profile(
    { currentAccount, }: { currentAccount: WalletAccount }
) {

    let defaultProfileState: ProfileState = {
        balance: "",
        favoriteXchgAddresses: [],
        own_routers: [],
        sponsoredXchgAddresses: [],
    }


    //let currentAccount = useCurrentAccount();
    const [profileLoaded, setProfileLoaded] = useState(false);
    const counterPackageId = useNetworkVariable("counterPackageId");
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [profileState, setProfileState] = useState(defaultProfileState);

    const [profileNotFound, setProfileNotFound] = useState(false);
    const [xchgAddressToAdd, setXchgAddressToAdd] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("0");
    const [sponsorLimitPerDay, setSponsorLimitPerDay] = useState("86400000");

    ///////////////////////////////////////////////////////////////
    // Dialog
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [submittedText, setSubmittedText] = useState('');
    const [dialogHeader, setDialogHeader] = useState('');
    
    const [dialogData, setDialogData] = useState('');
    const [dialogType, setDialogType] = useState('');
    
    const handleOpenDialog = () => setDialogOpen(true);
    const handleCloseDialog = () => setDialogOpen(false);
    const handleSubmit = (value: string) => {
        setSubmittedText(value);

        if (dialogType === "updateSponsoring") {
            let valueAsNumber = parseFloat(value);
            if (isNaN(valueAsNumber)) {
                alert("Invalid number");
                return;
            }
            updateSponsoring(dialogData, valueAsNumber);
        }
    }
    ///////////////////////////////////////////////////////////////

    // console.log("Current Account: ", currentAccount);

    useEffect(() => {
        if (!profileLoaded) {
            getProfileObject();
        }
    });

    const reloadProfile = () => {
        setProfileLoaded(false);
        setProfileNotFound(false);
        getProfileObject();
    }

    interface XchgAddrObject {
        balance: string,
        ownerSuiAddr: string,
        sponsors: SponsorXchgAddress[]
    }

    interface FavotiveXchgAddress {
        name: string,
        group: string,
        description: string,
        balance: string,
        xchgAddr: string,
        xchgAddrObject: XchgAddrObject,
    }

    /*
       limitPerDay: u64,
    virtualBalance : u64,
    lastOperation: u64,
    suiAddr: address, 
    */

    interface SponsorXchgAddress {
        suiAddr: string,
        lastOperation: string,
        virutalBalance: string,
        limitPerDay: string,
    }

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

        let sponsors: SponsorXchgAddress[] = [];

        if (fields.sponsors != null) {

            for (let i = 0; i < fields.sponsors.length; i++) {
                let item = fields.sponsors[i];

                let sponsorItem: SponsorXchgAddress = {
                    suiAddr: item.fields.suiAddr,
                    lastOperation: item.fields.lastOperation,
                    virutalBalance: item.fields.virtualBalance,
                    limitPerDay: item.fields.limitPerDay,
                }

                sponsors.push(sponsorItem);
            }
        }

        let xcgfAddrObject: XchgAddrObject = {
            balance: fields.balance,
            ownerSuiAddr: fields.ownerSuiAddr,
            sponsors: sponsors,
        }

        console.log("XCHG_ADDR_OBJECT: ", xcgfAddrObject);

        return xcgfAddrObject;
    }

    const getProfileObject = async () => {
        try {
            setProfileLoaded(false);
            console.log("Get Profile Object", currentAccount);
            if (!currentAccount) {
                console.log("Current Account not found");
                return;
            }
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
            setProfileLoaded(true);

            if (resultGetProfile.data == null) {
                console.log("Profile Object not found");
                setProfileNotFound(true);
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

                let addrObj = await getXchgAddressObject(item.fields.xchgAddr);

                let balance = "-";
                if (addrObj != null) {
                    balance = addrObj.balance;
                }

                let favItem: FavotiveXchgAddress = {
                    name: item.fields.name,
                    group: item.fields.group,
                    description: item.fields.description,
                    xchgAddr: item.fields.xchgAddr,
                    balance: balance,
                }
                let xchgAddressObject = await getXchgAddressObject(item.fields.xchgAddr);
                favItem.xchgAddrObject = xchgAddressObject;

                state.favoriteXchgAddresses.push(favItem);
            }

            console.log("State", state);

            //let favoriteXchgAddresses = fields.value.fields.favoriteXchgAddresses.fields;
            //console.log("Favorite Xchg Addresses: ", favoriteXchgAddresses);

            setProfileState(state);
        } catch (ex) {
            console.log("Exception Error: ", ex);
        }
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

                    reloadProfile();

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

                    reloadProfile();

                    alert("OK");
                },
                onError: (error) => {
                    alert("Error: " + error);
                }

            },
        );
    }

    const depositToXchgAddress = async (xchgAddr: string) => {
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

        //let xchgAddr = "0x5ded23a41eb84ec1f95b27d14222155f145a45e76a6377ae9cfcf754a4da9956"

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
                    reloadProfile();
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

        let withdrawAmountNumber = parseFloat(withdrawAmount);

        const tx = new Transaction();
        tx.moveCall({
            arguments: [tx.object(TESTNET_COUNTER_FUND_ID), tx.pure.u64(withdrawAmountNumber)],
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

        //let xchgAddr = "0x000102030405060708090A0B0C0D0E0F000102030405060708090A0B0C0D0E0F"

        let xchgAddr = xchgAddressToAdd;
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
                    reloadProfile();
                    alert("OK");
                },
                onError: (error) => {
                    alert("Error: " + error);
                }

            },
        );
    }

    const removeFavoriteXchgAddress = async (xchgAddr: string) => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();
        tx.moveCall({
            arguments: [
                tx.object(TESTNET_COUNTER_FUND_ID),
                tx.pure.address(xchgAddr),
            ],
            target: `${counterPackageId}::fund::removeFavoriteXchgAddress`,
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
                    reloadProfile();
                    alert("OK");
                },
                onError: (error) => {
                    alert("Error: " + error);
                }

            },
        );
    }

    const startSponsoring = async (xchgAddr: string) => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();
        tx.moveCall({
            arguments: [
                tx.object(TESTNET_COUNTER_FUND_ID),
                tx.pure.address(xchgAddr),
                tx.pure.u64(86400000),
            ],
            target: `${counterPackageId}::fund::becomeSponsor`,
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
                    reloadProfile();
                    alert("OK");
                },
                onError: (error) => {
                    alert("Error: " + error);
                }

            },
        );
    }

    const updateSponsoringDialog = async (xchgAddr: string) => {
        setDialogData(xchgAddr);
        setDialogType("updateSponsoring");
        setDialogHeader("Update Sponsor");
        handleOpenDialog();
    }

    const updateSponsoring = async (xchgAddr: string, limit: number) => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();
        tx.moveCall({
            arguments: [
                tx.object(TESTNET_COUNTER_FUND_ID),
                tx.pure.address(xchgAddr),
                tx.pure.u64(limit),
            ],
            target: `${counterPackageId}::fund::updateSponsor`,
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
                    reloadProfile();
                    alert("OK");
                },
                onError: (error) => {
                    alert("Error: " + error);
                }

            },
        );
    }

    const stopSponsoring = async (xchgAddr: string) => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();
        tx.moveCall({
            arguments: [
                tx.object(TESTNET_COUNTER_FUND_ID),
                tx.pure.address(xchgAddr),
            ],
            target: `${counterPackageId}::fund::stopSponsor`,
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
                    reloadProfile();
                    alert("OK");
                },
                onError: (error) => {
                    alert("Error: " + error);
                }

            },
        );
    }

    if (!currentAccount) {
        return <div>Loading account...</div>;
    }

    const displayXchgBalance = (balanceStr: string) => {
        return parseFloat(balanceStr);
    }


    return (
        <>
            <hr style={{ marginTop: '20px' }} />
            <h1>PROFILE</h1>
            <Flex>
                {profileLoaded ? <div></div> : <div>loading</div>}
            </Flex>

            {profileNotFound
                &&
                <Button
                    style={{ margin: '12px' }}
                    onClick={() => create_profile()}
                >
                    CREATE PROFILE
                </Button>
            }

            {profileLoaded && !profileNotFound &&
                <Flex direction="column" gap="2">
                    <Flex>
                        {currentAccount.address}
                    </Flex>
                    <Flex direction="column" gap="2">
                        <Flex direction='column'>
                            <Flex direction='row' style={{ backgroundColor: '#333' }}>
                                <Flex style={{ fontSize: '24pt' }}>BALANCE</Flex>
                                <Flex flexGrow='1'></Flex>
                                <Button onClick={() => depositToProfile()}>DEPOSIT</Button>
                            </Flex>
                            <Flex direction='row' style={{ backgroundColor: '#333' }}>
                                <Flex style={{ fontSize: '24pt' }}>{displayXchgBalance(profileState.balance)} bytes</Flex>
                                <Flex flexGrow='1'></Flex>
                                <input
                                    placeholder="Amount to withdraw"
                                    style={{ width: '200px' }}
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                >
                                </input>
                                <Button onClick={() => removeStake()}>WITHDRAW</Button>
                            </Flex>
                        </Flex>
                        <Flex direction='column'>
                            <Flex style={{ fontSize: '24pt' }}>My Favorites:</Flex>
                            <Flex direction='row'>
                                <input
                                    placeholder="XCHG address"
                                    style={{ width: '300px' }}
                                    value={xchgAddressToAdd}
                                    onChange={(e) => setXchgAddressToAdd(e.target.value)}
                                >
                                </input>
                                <Button onClick={() => addFavoriteXchgAddress()}>ADD</Button>
                            </Flex>

                            <Flex direction="column">
                                {profileState.favoriteXchgAddresses.map((item, index) => (
                                    <Flex key={item.xchgAddr + "_" + index} style={{ borderTop: '1px solid #DDD' }} direction='column'>
                                        <Flex>XCHG Address: {item.xchgAddr}</Flex>
                                        <Flex>Group: {item.group}</Flex>
                                        <Flex>Description: {item.description}</Flex>
                                        <Flex>Balance: {item.balance}</Flex>
                                        <Flex key={item.xchgAddr + "_" + index + "_sponsors"}>
                                            <Flex key={item.xchgAddr + "_" + index + "_sponsors_header"}>SPONSORS:</Flex>
                                            {item.xchgAddrObject != null && item.xchgAddrObject.sponsors.map((sponsorItem, index) => (
                                                <Flex key={item.xchgAddr + "_sponsor_" + index} style={{ borderTop: '1px solid #DDD' }} direction='column'>
                                                    <Flex>SUI Address: {sponsorItem.suiAddr}</Flex>
                                                    <Flex>Last Operation: {sponsorItem.lastOperation}</Flex>
                                                    <Flex>Virtual Balance: {sponsorItem.virutalBalance}</Flex>
                                                    <Flex>Limit Per Day: {sponsorItem.limitPerDay}
                                                        <Button onClick={() => updateSponsoringDialog(item.xchgAddr)}>UPDATE</Button>
                                                    </Flex>
                                                </Flex>
                                            ))}
                                        </Flex>
                                        <Flex>
                                            <Button onClick={() => removeFavoriteXchgAddress(item.xchgAddr)}>REMOVE</Button>
                                            <Button onClick={() => depositToXchgAddress(item.xchgAddr)}>DEPOSIT TO ADDRESS</Button>
                                            <Button onClick={() => startSponsoring(item.xchgAddr)}>START SPONSORING</Button>
                                            <Button onClick={() => stopSponsoring(item.xchgAddr)}>STOP SPONSORING</Button>
                                        </Flex>
                                    </Flex>
                                ))
                                }
                            </Flex>
                        </Flex>

                    </Flex>

                    <Flex>
                        0x5ded23a41eb84ec1f95b27d14222155f145a45e76a6377ae9cfcf754a4da9956
                    </Flex>

                    <hr />
                    <hr />
                    <hr />
                    <hr />
                    <hr />
                    <Button onClick={() => getProfileObject()}>GET STATE</Button>

                    <div style={{ padding: '20px' }}>
                        <button onClick={handleOpenDialog}>Open Dialog</button>
                        <p>Submitted Text: {submittedText}</p>
                        <TextInputDialog
                            isOpen={isDialogOpen}
                            header={dialogHeader}
                            onClose={handleCloseDialog}
                            onSubmit={handleSubmit}
                        />
                    </div>


                </Flex>
            }

        </>
    );
}
