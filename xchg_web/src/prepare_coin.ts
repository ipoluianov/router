import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { DError, makeError } from "./error";
import type { WalletAccount } from '@mysten/wallet-standard';
import { SuiClient } from "@mysten/sui/client";

const prepareCoin = async (suiClient: SuiClient, account: WalletAccount, tx: Transaction, coinType: string, amount: bigint): (Promise<TransactionResult | DError>) => {
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


export { prepareCoin };
