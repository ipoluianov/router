import {
    useSignAndExecuteTransaction,
    useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Container, Flex, Table } from "@radix-ui/themes";
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

    interface RouterInfo {
        xchgAddr: string;
        segment: string;
        name: string;
        owner: string;
        ipAddr: string;
        totalStakeAmount: bigint;
        rewards: bigint;
    }


    const counterPackageId = useNetworkVariable("counterPackageId");
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    const [profileLoaded, setProfileLoaded] = useState(false);
    const [profileState, setProfileState] = useState(defaultProfileState);
    const [profileNotFound, setProfileNotFound] = useState(false);
    const [errorText, setErrorText] = useState('');
    const [routerInfo, setRouterInfo] = useState([]);

    const [processing, setProcessing] = useState(false);
    const [processingName, setProcessingName] = useState('');

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
                setErrorText("Invalid number");
                return;
            }
            updateSponsoring(dialogData, valueAsNumber);
        }

        if (dialogType === "addFavoriteXchgAddress") {
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
        setErrorText(xchgAddr + " Name: " + name + ", Group: " + group + ", Description: " + description);
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
            setErrorText("Invalid number");
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
            setErrorText("Invalid number");
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
        sponsoredByMe: boolean,
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

        if (resultGetXchgAddr.data == null) {
            console.log("Xchg Address Object not found");
            return;
        }

        let fields = getObjectFields(resultGetXchgAddr.data);
        fields = fields.value.fields;

        let sponsors: SponsorXchgAddress[] = [];

        let sponsoredByMe = false;

        if (fields.sponsors != null) {

            for (let i = 0; i < fields.sponsors.length; i++) {
                let item = fields.sponsors[i];

                let sponsorItem: SponsorXchgAddress = {
                    suiAddr: item.fields.suiAddr,
                    lastOperation: item.fields.lastOperation,
                    virutalBalance: item.fields.virtualBalance,
                    limitPerDay: item.fields.limitPerDay,
                }

                if (item.fields.suiAddr == currentAccount.address) {
                    sponsoredByMe = true;
                }

                sponsors.push(sponsorItem);
            }
        }

        let xcgfAddrObject: XchgAddrObject = {
            balance: fields.balance,
            ownerSuiAddr: fields.ownerSuiAddr,
            sponsors: sponsors,
            sponsoredByMe: sponsoredByMe,
        }


        return xcgfAddrObject;
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

    const getProfileObject = async () => {
        try {
            setProcessing(true);
            setProcessingName('loading profile');
            setProfileLoaded(false);

            if (!currentAccount) {
                console.log("Current Account not found");
                setProcessing(false);

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

            if (resultGetProfile.data == null) {
                console.log("Profile Object not found");
                setProfileNotFound(true);
                setProfileLoaded(true);
                setProcessing(false);

                return;
            }

            let fields = getObjectFields(resultGetProfile.data);
            fields = fields.value.fields;

            let state: ProfileState = {
                balance: fields.balance,
                favoriteXchgAddresses: [],
                own_routers: [],
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

            let routers: RouterInfo[] = [];

            for (let i = 0; i < fields.own_routers.length; i++) {
                let item = fields.own_routers[i];
                let routerObj = await getRouterObject(item);
                routers.push(routerObj);
                console.log("Router Item: ", routerObj);
            }

            setRouterInfo(routers);

            setProfileLoaded(true);
            setProfileState(state);
        } catch (ex) {
            setErrorText("Error: " + ex);
        }

        setProcessing(false);

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

                    setErrorText("OK");
                },
                onError: (error) => {
                    setErrorText("Error: " + error);
                }

            },
        );
    }

    const profileDeposit = async (amount: number) => {
        if (!currentAccount) {
            return;
        }

        setProcessing(true);
        setProcessingName('depositing');

        const tx = new Transaction();

        let amountBigInt = BigInt(amount);

        const coin = await prepareCoin(suiClient, currentAccount, tx, TB_TYPE, amountBigInt);
        console.log('coin', coin);
        // if coin is a DError
        if ('errorMessage' in coin) {
            setErrorText('Error: ' + coin.errorMessage);
            setProcessing(false);
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
                    setProcessing(false);
                    const { effects } = await suiClient.waitForTransaction({
                        digest: digest,
                        options: {
                            showEffects: true,
                            showRawEffects: true,
                        },
                    });

                    reloadProfile();

                    setErrorText("OK");
                },
                onError: (error) => {
                    setErrorText("Error: " + error);
                    setProcessing(false);
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
            setErrorText('Error: ' + coin.errorMessage);
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
                    setErrorText("OK");
                },
                onError: (error) => {
                    setErrorText("Error: " + error);
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
                    setErrorText("OK");
                },
                onError: (error) => {
                    setErrorText("Error: " + error);
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
                tx.pure.string(""),
                tx.pure.string(""),
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
                    setErrorText("OK");
                },
                onError: (error) => {
                    setErrorText("Error: " + error);
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
                    setErrorText("OK");
                },
                onError: (error) => {
                    setErrorText("Error: " + error);
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
                    setErrorText("OK");
                },
                onError: (error) => {
                    setErrorText("Error: " + error);
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
                    setErrorText("OK");
                },
                onError: (error) => {
                    setErrorText("Error: " + error);
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
                    setErrorText("OK");
                },
                onError: (error) => {
                    setErrorText("Error: " + error);
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
                    setErrorText("OK");
                },
                onError: (error) => {
                    setErrorText("Error: " + error);
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

    const numberWithCommas = (strNum: string) => {
        let x = parseFloat(strNum);
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    return (
        <Flex direction='column' align='stretch'>
            {
                errorText != '' &&
                <Flex align='center' direction='row' style={{ color: '#F55', backgroundColor: '#FF000030', padding: '12px', marginTop: '12px', marginBottom: '12px' }}>
                    <Flex style={{ fontWeight: 'bold' }}>{errorText}</Flex>
                    <Flex flexGrow='1'></Flex>
                    <Container flexGrow='0' style={styles.lightButton} onClick={() => { setErrorText('') }}>CLOSE</Container>
                </Flex>
            }
            <Flex direction='column' align='stretch'>
                <Flex direction='row' align='center' justify='between'>
                    <Flex style={{ fontSize: '12pt', fontFamily: 'Roboto Mono' }}>BALANCE</Flex>
                    <Flex direction='column' flexGrow='1' style={{ textAlign: 'center' }} align='center'>
                        {profileLoaded ? <div></div> : <Flex style={{ textAlign: 'center' }}>loading</Flex>}
                    </Flex>
                    <Container style={{ flexGrow: '0', padding: '0px', fontSize: '20pt', cursor: 'pointer', textAlign: 'center' }} onClick={() => getProfileObject()}>⟳</Container>
                </Flex>

                {profileNotFound
                    &&
                    <Flex direction='column' align='center'>
                        <Flex style={{ marginTop: '30px' }}>
                            PROFILE NOT FOUND
                        </Flex>
                        <Button
                            style={{ marginTop: '30px', backgroundColor: '#1a1a1a', border: '1px solid #0A5', width: '200px', height: '120px', cursor: 'pointer', color: '#0F7', fontSize: '16pt' }}
                            onClick={() => create_profile()}
                        >
                            CREATE PROFILE
                        </Button>
                    </Flex>
                }

                {profileLoaded && !profileNotFound &&
                    <Flex direction="column" gap="2">
                        <Flex direction="column" gap="2">
                            <Flex direction='column' style={{ backgroundColor: '#222', borderTop: '1px solid #777' }}>
                                <Flex direction='row' align='center' style={{}}>
                                    <Flex direction='column'>
                                        <Flex style={styles.textBlockBalance}>{displayXchgBalance(profileState.balance)}</Flex>
                                        <Flex style={{ marginLeft: '3px', fontSize: '10pt', color: '#777' }}>{numberWithCommas(profileState.balance)} bytes</Flex>
                                    </Flex>
                                    <Flex flexGrow='1'></Flex>
                                    <Container flexGrow='0' style={styles.depositButton} onClick={() => profileDepositDialog()}>DEPOSIT</Container>
                                    <Flex style={{ color: '#777' }}>|</Flex>
                                    <Container flexGrow='0' style={styles.withdrawButton} onClick={() => profileWithdrawDialog()}>WITHDRAW</Container>
                                </Flex>
                            </Flex>
                            <Flex direction='column'>
                                <Flex direction='row' align='end'>
                                    <Flex style={{ fontSize: '12pt' }}>NODES</Flex>

                                    <Container flexGrow='0' style={styles.addToFavButton} onClick={() => addFavoriteXchgAddressDialog()}>ADD</Container>
                                </Flex>

                                <Flex direction="column" style={{ backgroundColor: "#222", border: '0px solid #777' }}>
                                    {profileState.favoriteXchgAddresses.map((item, index) => (
                                        <Flex key={item.xchgAddr + "_" + index}
                                            style={{ backgroundColor: "#222", borderTop: '1px solid #777', margin: '0px', paddingBottom: '24px' }}
                                            direction='column'>
                                            <Flex direction='row'>
                                                <Flex direction='column'>
                                                    <Flex align='center'>
                                                        <Flex style={styles.textBlock}>
                                                            Address:
                                                        </Flex>
                                                        <Flex style={styles.xchgAddr}>
                                                            {shortAddress(item.xchgAddr)}
                                                        </Flex>
                                                        <Container style={{ cursor: 'pointer' }} onClick={() => copyTextToClipboard(item.xchgAddr)}>❐ </Container>
                                                    </Flex>
                                                    <Flex direction='row' align='center'>
                                                        <Flex style={styles.textBlock}>Name: {item.name}</Flex>
                                                        <Container style={styles.lightButton} onClick={() => updateFavDialog(item.xchgAddr)}>RENAME</Container>
                                                    </Flex>
                                                    <Flex direction='row' align='center'>
                                                        <Flex style={styles.textBlock} >Balance: {item.balance}</Flex>
                                                        <Container style={styles.lightButton} onClick={() => depositToXchgAddress(item.xchgAddr)}>DEPOSIT</Container>
                                                    </Flex>
                                                </Flex>
                                                <Flex flexGrow='1'></Flex>
                                                <Flex direction='column'>
                                                    <Flex direction='column'>
                                                        <Container style={styles.lightButton} onClick={() => removeFavoriteXchgAddress(item.xchgAddr)}>REMOVE</Container>
                                                    </Flex>
                                                </Flex>
                                            </Flex>
                                            <Flex key={item.xchgAddr + "_" + index + "_sponsors"} direction='column'>
                                                {item.xchgAddrObject != null && item.xchgAddrObject.sponsors.map((sponsorItem, index) => (
                                                    sponsorItem.suiAddr == currentAccount.address &&
                                                    <Flex key={item.xchgAddr + "_sponsor_" + index} style={{}} direction='row' align='center'>
                                                        <Flex direction='column'>
                                                            <Flex style={styles.textBlock}>Sponsoring limit:</Flex>
                                                            <Container style={styles.lightButton} onClick={() => updateSponsoringDialog(item.xchgAddr)}>UPDATE LIMIT</Container>
                                                        </Flex>
                                                        <Flex direction='column'>
                                                            <Flex style={styles.textBlock}>{sponsorItem.limitPerDay} bytes per day</Flex>
                                                            <Container style={styles.lightButton} onClick={() => stopSponsoring(item.xchgAddr)}>STOP SPONSORING</Container>
                                                        </Flex>
                                                    </Flex>
                                                ))}

                                                {
                                                    (item.xchgAddrObject == null || item.xchgAddrObject.sponsors.length == 0 || item.xchgAddrObject.sponsoredByMe == false) &&
                                                    <Flex style={{ color: '#777', fontSize: '10pt' }}>
                                                        <Container style={styles.lightButton} onClick={() => startSponsoring(item.xchgAddr)}>START SPONSORING</Container>
                                                    </Flex>
                                                }
                                            </Flex>
                                        </Flex>
                                    ))
                                    }
                                </Flex>
                            </Flex>

                        </Flex>

                        <Flex direction="column" gap="2">
                            <Flex direction="column" gap="2">
                                <Flex direction="column">
                                    <Flex direction="row">
                                    </Flex>
                                </Flex>
                                <Flex>
                                    <Flex>
                                        ROUTERS ({routerInfo.length})
                                    </Flex>
                                    <Flex>
                                        <Container
                                            style={styles.addToFavButton}
                                            onClick={() => createRouter()}>
                                            ADD
                                        </Container>
                                    </Flex>
                                </Flex>
                                <Flex direction='column'>
                                    {routerInfo?.map((item) => (
                                        <Flex style={{
                                            borderTop: '1px solid #777',
                                            backgroundColor: '#222',
                                            margin: '0px',
                                            padding: '0px',
                                        }}
                                            key={item.xchgAddr} direction='column'>
                                            <Flex>
                                                <Flex style={styles.textBlock}>
                                                    Address:
                                                </Flex>
                                                <Flex style={styles.xchgAddr}>
                                                    {shortAddress(item.xchgAddr)}
                                                </Flex>
                                                <Container style={{ cursor: 'pointer' }} onClick={() => copyTextToClipboard(item.xchgAddr)}>❐ </Container>
                                            </Flex>
                                            <Flex style={styles.textBlock}>Segment: {item.segment}</Flex>
                                            <Flex style={styles.textBlock}>Name: {item.name}</Flex>
                                            <Flex style={styles.textBlock}>IP Address: {item.ipAddr}</Flex>
                                            <Flex style={styles.textBlock}>Total Stake Amount: {item.totalStakeAmount}</Flex>
                                            <Flex style={styles.textBlock}>Rewards: {item.rewards}</Flex>
                                            <Flex direction="row">
                                                <Container
                                                    flexGrow='0'
                                                    style={styles.lightButton}
                                                    onClick={() => addStake(item.xchgAddr)}

                                                > ADD STAKE
                                                </Container>
                                                <Container
                                                    flexGrow='0'
                                                    style={styles.lightButton}
                                                    onClick={() => removeStake(item.xchgAddr)}

                                                > REMOVE STAKE
                                                </Container>
                                            </Flex>
                                        </Flex>
                                    ))}
                                </Flex>
                            </Flex>
                        </Flex>


                        <Flex style={{ color: '#444444', fontSize: '10pt' }}>
                            0x5ded23a41eb84ec1f95b27d14222155f145a45e76a6377ae9cfcf754a4da9956
                        </Flex>

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
                            totalCoins={profileState.balance}
                            isOpen={isProfileWithdrawDialogOpen}
                            onClose={handleCloseProfileWithdrawDialog}
                            onSubmit={handleSubmitProfileWithdrawDialog}
                        />

                        <ProfileDepositDialog
                            suiClient={suiClient}
                            account={currentAccount}
                            coinType={TB_TYPE}
                            isOpen={isProfileDepositDialogOpen}
                            onClose={handleCloseProfileDepositDialog}
                            onSubmit={handleSubmitProfileDepositDialog}
                        />

                    </Flex>
                }
            </Flex>
            {
                processing &&
                <Flex hidden={false} style={styles.overlay}>
                    {processingName}
                </Flex>
            }
        </Flex>
    );
}

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
    removeButton: {
        fontFamily: 'Roboto Mono',
        margin: '3px',
        padding: '3px',
        border: '1px solid #777',
        borderRadius: '5px',
        cursor: 'pointer',
        backgroundColor: '#333',
        color: '#fff',
        width: '30px',
    },
    lightButton: {
        fontFamily: 'Roboto Mono',
        fontSize: '10pt',
        margin: '0px',
        padding: '3px',
        cursor: 'pointer',
        color: '#0AF',
    },
    depositButton: {
        fontFamily: 'Roboto Mono',
        fontSize: '12pt',
        margin: '0px',
        paddingRight: '12px',
        cursor: 'pointer',
        color: '#0AF',
    },
    withdrawButton: {
        fontFamily: 'Roboto Mono',
        fontSize: '12pt',
        margin: '0px',
        paddingLeft: '12px',
        paddingRight: '12px',
        cursor: 'pointer',
        color: '#0AF',
    },
    addToFavButton: {
        fontFamily: 'Roboto Mono',
        fontSize: '12pt',
        margin: '0px',
        paddingLeft: '12px',
        paddingRight: '12px',
        cursor: 'pointer',
        color: '#0AF',
    },
    suiAddr: {
        fontFamily: 'Roboto Mono',
        color: '#AAA',
        margin: '3px',
    },
    xchgAddr: {
        fontFamily: 'Roboto Mono',
        color: '#EEE',
        margin: '3px',
    },
    textBlock: {
        fontFamily: 'Roboto Mono',
        margin: '3px',
    },
    textBlockBalance: {
        fontFamily: 'Roboto Mono',
        marginLeft: '3px',
        color: '#0F8',
        fontSize: '16pt',
    },
};
