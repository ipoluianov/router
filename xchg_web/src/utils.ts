import { MoveStruct, SuiClient, SuiObjectData } from "@mysten/sui/client";
import { TESTNET_COUNTER_FUND_ID } from "./constants";
import { Fund } from "./Fund";

function shortAddress(address: string | null): string {
    if (address == null) {
        return "";
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export { shortAddress };

// Fund interface
export interface Fund {
    balance: string;
    tableAddresses: string;
    tableRouters: string;
    tableNetwork: string;
    tableProfiles: string;
}

export async function getFund(suiClient: SuiClient) : Promise<Fund | null> {
    let fundId = TESTNET_COUNTER_FUND_ID;
    const fundObj = await suiClient.getObject({
        id: fundId,
        options: {
            showContent: true,
            showOwner: true,
        },
    });

    if (fundObj.data == null) {
        return null;
    }

    if (fundObj.data.content == null) {
        return null;
    }

    const fundFields = fundObj.data.content as {fields: MoveStruct};
    if (!fundFields) {
        return null;
    }

    console.log("Fund fields: ", fundFields);

    let fields = fundFields.fields as {
        addresses: any, 
        routers: any,
        network: any,
        profiles: any,
        balance: string
    };

    console.log("Addresses: ", fields);

    const fund: Fund = {
        balance: fields.balance,
        tableAddresses: (fields.addresses as {fields : any}).fields.id.id,
        tableRouters: (fields.routers as {fields : any}).fields.id.id,
        tableNetwork: (fields.network as {fields : any}).fields.id.id,
        tableProfiles: (fields.profiles as {fields : any}).fields.id.id,
    };

    return fund;
}

export interface RouterInfo {
    xchgAddr: string;
    stake: number;
    ipAddr: string;
}

export interface Network {
    routers: RouterInfo[];
}

export interface AllNetworks {
    networks: Network[];
}

export async function getNetwork(tableNetwork: string, suiClient: SuiClient, index: number) {
    let networkObj = await suiClient.getDynamicFieldObject(
        {
            parentId: tableNetwork,
            name: {
                type: "u32",
                value: index,
            }
        }
    );

    if (networkObj == null) {
        return null;
    }

    if (networkObj.data == null) {
        return null;
    }

    if (networkObj.data.content == null) {
        return null;
    }

    let result : Network = { routers: [] };
    let routers = (networkObj.data.content as {fields : any}).fields.value.fields.routers;

    for (let i = 0; i < routers.length; i++) {
        let router = routers[i].fields;
        let routerInfo : RouterInfo = {
            xchgAddr: router.xchgAddress,
            stake: parseFloat(router.currentStake),
            ipAddr: router.ipAddr,
        };
        result.routers.push(routerInfo as RouterInfo);
    }

    console.log("Parsed: ", networkObj);

    return result;
}

export function getObjectFields(data: (SuiObjectData | undefined | null)) {
    if (data?.content?.dataType !== "moveObject") {
        return null;
    }
    return data.content.fields;
}

export function displayXchgBalance(balanceStr: string) {
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
    if (balance >= 1000000000) {
        balanceFormatted = (balance / 1000000000).toFixed(3) + ' GB';
    }

    return balanceFormatted;
}
