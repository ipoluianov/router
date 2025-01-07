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
