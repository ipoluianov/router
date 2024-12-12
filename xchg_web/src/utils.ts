import { SuiObjectData } from "@mysten/sui/client";

function shortAddress(address: string | null): string {
    if (address == null) {
        return "";
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export { shortAddress };

export function getObjectFields(data: (SuiObjectData | undefined | null))  {
    if (data?.content?.dataType !== "moveObject") {
        return null;
    }
    return data.content.fields;
}
