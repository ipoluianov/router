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
import { GB_TYPE, TESTNET_COUNTER_FUND_ID } from "./constants";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { makeError } from "./error";

export function Fund() {

    const currentAccount = useCurrentAccount();

    const counterPackageId = useNetworkVariable("counterPackageId");
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isWaitingForTransaction, setIsWaitingForTransaction] = useState(false);

    const [textToSet, setTextToSet] = useState("");

    const [fundState, setFundState] = useState({});

    const [waitingForTxn, setWaitingForTxn] = useState("");

    interface FundState {
        address: string;
        balance: string;
        commonFund: string;
        counter: string;
        tableAddressesId: string;
        tableNetworksId: string;
        tableProfilesId: string;
        tableRoutersId: string;
    }

    const loadFundState = async () => {
        console.log("Loading fund state");
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
        if (fields != null) {
            let state: FundState = {
                address: fields.id.id,
                balance: fields.balance,
                commonFund: fields.commonFund,
                counter: fields.counter,
                tableAddressesId: fields.addresses.fields.id.id,
                tableNetworksId: fields.network.fields.id.id,
                tableProfilesId: fields.profiles.fields.id.id,
                tableRoutersId: fields.routers.fields.id.id,
            };
            setFundState(state);
        }
    }


    let isDisabled = false;
    if (isWaitingForTransaction) {
        isDisabled = true;
    }

    return (
        <>
            <hr style={{ marginTop: '20px' }} />
            <h1>FUND</h1>

            <Flex direction="column" gap="2">
                <Flex direction="column" gap="2">
                    <Flex direction="column">
                        <Flex direction="row">
                            <Button
                                style={{ margin: '12px' }}
                                onClick={() => loadFundState()}
                                disabled={waitingForTxn !== ""}
                            > GET STATE
                            </Button>
                        </Flex>
                    </Flex>
                    <Flex>
                        id: {fundState.address}
                    </Flex>
                    <Flex>
                        balance: {fundState.balance}
                    </Flex>
                    <Flex>
                        commonFund: {fundState.commonFund}
                    </Flex>
                    <Flex>
                        counter: {fundState.counter}
                    </Flex>
                    <Flex>
                        tableAddressesId: {fundState.tableAddressesId}
                    </Flex>
                    <Flex>
                        tableNetworksId: {fundState.tableNetworksId}
                    </Flex>
                    <Flex>
                        tableProfilesId: {fundState.tableProfilesId}
                    </Flex>
                    <Flex>
                        tableRoutersId: {fundState.tableRoutersId}
                    </Flex>

                </Flex>
            </Flex>
        </>
    );
}
