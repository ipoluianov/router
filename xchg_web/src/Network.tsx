import {
    useSuiClient,
} from "@mysten/dapp-kit";
import { Button, Container, Flex } from "@radix-ui/themes";
import { AllNetworks, displayXchgBalance, getFund, getNetwork, getObjectFields, shortAddress } from "./utils";
import { TESTNET_COUNTER_FUND_ID } from "./constants";
import { useState } from "react";

export function Network() {
    const suiClient = useSuiClient();

    const [networkInfo, setNetworkInfo] = useState<AllNetworks>({ networks: [] });

    const [loadedNetworksCount, setLoadedNetworksCount] = useState(0);

    const loadNetwork = async () => {
        console.log("Loading network");
        setLoadedNetworksCount(0);
        setNetworkInfo({ networks: [] });
        let fund = await getFund(suiClient);
        if (!fund) {
            console.log("No fund found");
            return;
        }

        let allNetworks: AllNetworks = { networks: [] };

        for (let i = 0; i < 4; i++) {
            const n = await getNetwork(fund.tableNetwork, suiClient, i);
            if (n == null) {
                continue;
            }
            console.log("Network ", i, ": ", n);
            allNetworks.networks.push(n);
            setLoadedNetworksCount(i + 1);

            await new Promise((resolve) => {
                setTimeout(resolve, 100);
            });
        }

        setNetworkInfo(allNetworks);
    }

    return (
        <div style={{ fontFamily: 'Roboto Mono' }}>   
            <h1>NETWORK</h1>
            <Flex direction="column" gap="2">
                <Flex direction="column" gap="2">
                    <Flex direction="row">
                        <Container
                            style={ styles.lightButton }
                            onClick={() => loadNetwork()}
                        > LOAD NETWORK
                        </Container>
                    </Flex>
                    <Flex>
                        Loaded networks: {loadedNetworksCount}
                    </Flex>
                    <Flex direction='column'>
                        {
                            networkInfo.networks.map((network, index) => {
                                return (
                                    <Flex key={index} direction='column' style={{ backgroundColor: '#333', margin: '12px' }}>
                                        <Flex direction='row' align='center' justify='between' style={{ backgroundColor: '#222', padding: '6px' }}>
                                            <Flex>Network: {index}</Flex>
                                            <Flex>Routers: {network.routers.length}</Flex>
                                        </Flex>
                                        <Flex direction={'column'} style={{  }}>
                                            {
                                                network.routers.map((router, index) => {
                                                    return (
                                                        <Flex key={index} direction='column' style={{ backgroundColor: '#222', borderTop: '1px solid #777', padding: '6px' }}>
                                                            <Flex>XCHGAD {shortAddress(router.xchgAddr)}</Flex>
                                                            <Flex>IPADDR {router.ipAddr}</Flex>
                                                            <Flex>STAKE: {displayXchgBalance(router.stake.toString())}</Flex>
                                                        </Flex>
                                                    );
                                                }
                                                )
                                            }
                                        </Flex>
                                    </Flex>
                                );
                            }
                            )
                        }
                    </Flex>
                </Flex>
            </Flex>
        </div>
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
