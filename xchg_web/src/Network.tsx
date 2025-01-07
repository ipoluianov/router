import {
    useSuiClient,
} from "@mysten/dapp-kit";
import { Button, Flex } from "@radix-ui/themes";
import { getObjectFields } from "./utils";
import { TESTNET_COUNTER_FUND_ID } from "./constants";
import { useState } from "react";

export function Network() {
    const suiClient = useSuiClient();

    const [networkInfo, setNetworkInfo] = useState({});

    const getNetworkTableId = async () => {
        let fundId = TESTNET_COUNTER_FUND_ID;
        const resultGetFund = await suiClient.getObject({
            id: fundId,
            options: {
                showContent: true,
                showOwner: true,
            },
        });
        let fields = getObjectFields(resultGetFund.data);
        return fields.network.fields.id.id;
    }

    const loadNetwork = async () => {
        console.log("Loading network");
        let networkTableId = await getNetworkTableId();

        const network = await suiClient.getDynamicFieldObject(
            {
                parentId: networkTableId,
                name: {
                    type: "u32",
                    value: 1,
                }
            }
        );
        console.log("Network: ", network);

        let networkInfo = {};
        networkInfo.routers = network.data?.content.fields.value.fields.routers;

        console.log("Parsed: ", networkInfo);
        setNetworkInfo(networkInfo);
    }

    return (
        <>
            <h1>NETWORK</h1>
            <Flex direction="column" gap="2">
                <Flex direction="column" gap="2">
                    <Flex direction="row">
                        <Button
                            style={{ marginRight: '12px' }}
                            onClick={() => loadNetwork()}

                        > LOAD NETWORK
                        </Button>
                    </Flex>
                    <Flex>
                    
                    </Flex>
                    <Flex direction='column'>
                        {
                            networkInfo.routers &&
                            networkInfo.routers?.map((router, index) => {
                                return (
                                    <Flex key={index} direction='column' style={{borderTop: '1px solid #777'}}>
                                        <Flex>Index: {index}</Flex>
                                        <Flex>XCHG Addr: {router.fields.xchgAddress}</Flex>
                                        <Flex>Stake: {router.fields.currentStake}</Flex>
                                        <Flex>IP Addr: {router.fields.ipAddr}</Flex>
                                    </Flex>
                                );
                            })
                        }
                    </Flex>
                </Flex>
            </Flex>
        </>
    );
}
