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
import type { WalletAccount } from '@mysten/wallet-standard';
import TextInputDialog from "./TextInputDialog";
import EditFavoriteXchgAddressDialog from "./EditFavoriteXchgAddressDialog";
import ProfileWithdrawDialog from "./ProfileWithdrawDialog";
import ProfileDepositDialog from "./ProfileDepositDialog";
import { prepareCoin } from "./prepare_coin";

export function Profile(
    { currentAccount, }: { currentAccount: WalletAccount }
) {

    let defaultProfileState: ProfileState = {
        balance: "",
        favoriteXchgAddresses: [],
        own_routers: [],
    }

    const counterPackageId = useNetworkVariable("counterPackageId");
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    const [profileLoaded, setProfileLoaded] = useState(false);
    const [profileState, setProfileState] = useState(defaultProfileState);
    const [profileNotFound, setProfileNotFound] = useState(false);

    ///////////////////////////////////////////////////////////////
    // Dialog
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [dialogHeader, setDialogHeader] = useState('');

    const [dialogData, setDialogData] = useState('');
    const [dialogType, setDialogType] = useState('');

    const handleOpenDialog = () => setDialogOpen(true);
    const handleCloseDialog = () => setDialogOpen(false);
    const handleSubmit = (value: string) => {

        if (dialogType === "updateSponsoring") {
            let valueAsNumber = parseFloat(value);
            if (isNaN(valueAsNumber)) {
                alert("Invalid number");
                return;
            }
            updateSponsoring(dialogData, valueAsNumber);
        }

        if (dialogType === "addFavoriteXchgAddress") {
            //alert("Add Favorite Xchg Address: " + value);
            addFavoriteXchgAddress(value);
        }
    }
    ///////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////
    // EditFavoriteXchgAddressDialog
    const [isEditFavoriteXchgAddressDialogOpen, setEditFavoriteXchgAddressDialogOpen] = useState(false);
    const handleOpenEditFavoriteXchgAddressDialog = () => setEditFavoriteXchgAddressDialogOpen(true);
    const handleCloseEditFavoriteXchgAddressDialog = () => setEditFavoriteXchgAddressDialogOpen(false);
    const handleSubmitEditFavoriteXchgAddressDialog = (name: string, group: string, description: string) => {
        let xchgAddr = dialogData;
        alert(xchgAddr + " Name: " + name + ", Group: " + group + ", Description: " + description);
        updateFavoriteXchgAddress(xchgAddr, name, group, description);
    }
    const updateFavDialog = (xchgAddr: string) => {
        setDialogData(xchgAddr);
        handleOpenEditFavoriteXchgAddressDialog();
    }
    ///////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////
    // ProfileWithdrawDialog
    const [isProfileWithdrawDialogOpen, setProfileWithdrawDialogOpen] = useState(false);
    const handleOpenProfileWithdrawDialog = () => setProfileWithdrawDialogOpen(true);
    const handleCloseProfileWithdrawDialog = () => setProfileWithdrawDialogOpen(false);
    const handleSubmitProfileWithdrawDialog = (amount: string) => {
        let amountAsNumber = parseFloat(amount);
        if (isNaN(amountAsNumber)) {
            alert("Invalid number");
            return;
        }
        profileWithdraw(amountAsNumber);
    }
    const profileWithdrawDialog = () => {
        handleOpenProfileWithdrawDialog();
    }
    ///////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////
    // ProfileDepositDialog
    const [isProfileDepositDialogOpen, setProfileDepositDialogOpen] = useState(false);
    const handleOpenProfileDepositDialog = () => setProfileDepositDialogOpen(true);
    const handleCloseProfileDepositDialog = () => setProfileDepositDialogOpen(false);
    const handleSubmitProfileDepositDialog = (amount: string) => {
        let amountAsNumber = parseFloat(amount);
        if (isNaN(amountAsNumber)) {
            alert("Invalid number");
            return;
        }
        profileDeposit(amountAsNumber);
    }
    const profileDepositDialog = () => {
        handleOpenProfileDepositDialog();
    }
    ///////////////////////////////////////////////////////////////

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

    interface SponsorXchgAddress {
        suiAddr: string,
        lastOperation: string,
        virutalBalance: string,
        limitPerDay: string,
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

    const profileDeposit = async (amount: number) => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();

        let amountBigInt = BigInt(amount);

        const coin = await prepareCoin(suiClient, currentAccount, tx, TB_TYPE, amountBigInt);
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

        const coin = await prepareCoin(suiClient, currentAccount, tx, TB_TYPE, 10000000000n);
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

    const profileWithdraw = async (amount: number) => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();
        tx.moveCall({
            arguments: [tx.object(TESTNET_COUNTER_FUND_ID), tx.pure.u64(amount)],
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
                    reloadProfile();
                    alert("OK");
                },
                onError: (error) => {
                    alert("Error: " + error);
                }

            },
        );
    }

    const addFavoriteXchgAddressDialog = () => {
        setDialogType("addFavoriteXchgAddress");
        setDialogHeader("Add Favorite Xchg Address");
        handleOpenDialog();
    }

    const addFavoriteXchgAddress = async (xchgAddr: string) => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();

        //let xchgAddr = "0x000102030405060708090A0B0C0D0E0F000102030405060708090A0B0C0D0E0F"

        //let xchgAddr = xchgAddressToAdd;
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

    const updateFavoriteXchgAddress = async (xchgAddr: string, name: string, group: string, description: string) => {
        if (!currentAccount) {
            return;
        }

        const tx = new Transaction();

        //let xchgAddr = "0x000102030405060708090A0B0C0D0E0F000102030405060708090A0B0C0D0E0F"

        //let xchgAddr = xchgAddressToAdd;
        tx.moveCall({
            arguments: [
                tx.object(TESTNET_COUNTER_FUND_ID),
                tx.pure.address(xchgAddr),
                tx.pure.string(name),
                tx.pure.string(group),
                tx.pure.string(description),
            ],
            target: `${counterPackageId}::fund::modifyFavoriteXchgAddress`,
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
        let balance = parseFloat(balanceStr);
        if (isNaN(balance)) {
            balance = 0;
        }
        if (balance < 0) {
            balance = 0;
        }

        let balanceFormatted = '---';
        if (balance >= 0 && balance < 1000) {
            balanceFormatted = balance + ' bytes';
        }
        if (balance >= 1000 && balance < 1000000) {
            balanceFormatted = (balance / 1000).toFixed(3) + ' KB';
        }
        if (balance >= 1000000 && balance < 1000000000) {
            balanceFormatted = (balance / 1000000).toFixed(3) + ' MB';
        }
        if (balance >= 1000000000 && balance < 1000000000000) {
            balanceFormatted = (balance / 1000000000).toFixed(3) + ' GB';
        }
        if (balance >= 1000000000000) {
            balanceFormatted = (balance / 1000000000000).toFixed(3) + ' TB';
        }

        return balanceFormatted;
    }

    const copyTextToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    }

    return (
        <Flex direction='column' align='stretch'>
            <Flex direction='column' align='stretch'>
                <Flex direction='row'>
                    <Flex style={{ fontSize: '24pt' }}>My Xchg Profile</Flex>
                    <Flex flexGrow='1'></Flex>
                    <Button style={styles.button} onClick={() => getProfileObject()}>UPDATE</Button>
                </Flex>
                <Flex>
                    {profileLoaded ? <div></div> : <div>loading</div>}
                </Flex>

                {profileNotFound
                    &&
                    <Flex direction='column' align='center'>
                        <Flex style={{ marginTop: '30px' }}>
                            PROFILE NOT FOUND
                        </Flex>
                        <Button
                            style={{ marginTop: '30px', backgroundColor: '#1a1a1a', border: '1px solid #0A5', width: '200px', height: '120px', cursor: 'pointer' }}
                            onClick={() => create_profile()}
                        >
                            CREATE PROFILE
                        </Button>
                    </Flex>
                }

                {profileLoaded && !profileNotFound &&
                    <Flex direction="column" gap="2">
                        <Flex direction="column" gap="2">
                            <Flex direction='column' style={{ backgroundColor: '#222', border: '1px solid #555' }}>
                                <Flex direction='row' align='center' style={{}}>
                                    <Flex style={styles.suiAddr}>{shortAddress(currentAccount.address)}</Flex>
                                    <Flex flexGrow='1'></Flex>
                                    <Button style={styles.button} onClick={() => profileDepositDialog()}>DEPOSIT</Button>
                                </Flex>
                                <Flex direction='row' align='center' style={{}}>
                                    <Flex style={styles.textBlock}>{displayXchgBalance(profileState.balance)}</Flex>
                                    <Flex flexGrow='1'></Flex>
                                    <Button style={styles.button} onClick={() => profileWithdrawDialog()}>WITHDRAW</Button>
                                </Flex>
                                <Flex direction='row' align='center' style={{}}>
                                    <Flex style={styles.textBlock}>{profileState.balance} bytes</Flex>
                                    <Flex flexGrow='1'></Flex>
                                </Flex>
                            </Flex>
                            <Flex direction='column'>
                                <Flex style={{ fontSize: '24pt' }}>My Favorites:</Flex>
                                <Flex direction='row'>
                                    <Button onClick={() => addFavoriteXchgAddressDialog()}>ADD</Button>
                                </Flex>

                                <Flex direction="column">
                                    {profileState.favoriteXchgAddresses.map((item, index) => (
                                        <Flex key={item.xchgAddr + "_" + index}
                                            style={{ border: '1px solid #55F', margin: '10px', padding: '10px' }}
                                            direction='column'>
                                            <Flex align='center'>
                                                <Flex style={styles.textBlock}>
                                                    XCHG Address:
                                                </Flex>
                                                <Flex style={styles.xchgAddr}>
                                                    {shortAddress(item.xchgAddr)}
                                                </Flex>
                                                <Button style={styles.button} onClick={() => copyTextToClipboard(item.xchgAddr)}>COPY</Button>
                                            </Flex>
                                            <Flex>Name: {item.name}</Flex>
                                            <Flex>Group: {item.group}</Flex>
                                            <Flex>Description: {item.description}</Flex>
                                            <Flex>Balance: {item.balance}</Flex>
                                            <Flex>
                                                <Button onClick={() => updateFavDialog(item.xchgAddr)}>UPDATE FAV</Button>
                                            </Flex>
                                            <Flex key={item.xchgAddr + "_" + index + "_sponsors"}>
                                                <Flex key={item.xchgAddr + "_" + index + "_sponsors_header"}>SPONSORS:</Flex>
                                                {item.xchgAddrObject != null && item.xchgAddrObject.sponsors.map((sponsorItem, index) => (
                                                    <Flex key={item.xchgAddr + "_sponsor_" + index} style={{ borderTop: '1px solid #DDD' }} direction='column'>
                                                        <Flex>SUI Address: {shortAddress(sponsorItem.suiAddr)}</Flex>
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

                        <TextInputDialog
                            isOpen={isDialogOpen}
                            header={dialogHeader}
                            onClose={handleCloseDialog}
                            onSubmit={handleSubmit}
                        />
                        <EditFavoriteXchgAddressDialog
                            isOpen={isEditFavoriteXchgAddressDialogOpen}
                            onClose={handleCloseEditFavoriteXchgAddressDialog}
                            onSubmit={handleSubmitEditFavoriteXchgAddressDialog}
                        />

                        <ProfileWithdrawDialog
                            isOpen={isProfileWithdrawDialogOpen}
                            onClose={handleCloseProfileWithdrawDialog}
                            onSubmit={handleSubmitProfileWithdrawDialog}
                        />

                        <ProfileDepositDialog
                            isOpen={isProfileDepositDialogOpen}
                            onClose={handleCloseProfileDepositDialog}
                            onSubmit={handleSubmitProfileDepositDialog}
                        />

                    </Flex>
                }
            </Flex>
        </Flex>
    );
}

const styles: Record<string, React.CSSProperties> = {
    button: {
        fontFamily: 'Roboto Mono',
        margin: '6px',
        padding: '6px',
        border: '1px solid #777',
        borderRadius: '5px',
        cursor: 'pointer',
        backgroundColor: '#333',
        color: '#fff',
        width: '100px',
    },
    suiAddr: {
        fontFamily: 'Roboto Mono',
        color: '#55F',
        margin: '6px',
    },
    xchgAddr: {
        fontFamily: 'Roboto Mono',
        color: '#5F5',
        margin: '6px',
    },
    textBlock: {
        fontFamily: 'Roboto Mono',
        margin: '6px',
    },
};
