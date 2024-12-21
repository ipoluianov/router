import { Transaction, TransactionResult, BuildTransactionOptions } from "@mysten/sui/transactions";
import { Button, Container } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";
import { useCurrentAccount } from "@mysten/dapp-kit";
import type { WalletAccount } from '@mysten/wallet-standard';
import React from "react";
import { DError, makeError } from "./error.ts";
import { TESTNET_COUNTER_FUND_ID } from "./constants.ts";
import { Ed25519Keypair } from '@mysten/sui/crypto';

export function CreateCounter() {
	const currentAccount = useCurrentAccount();
	const counterPackageId = useNetworkVariable("counterPackageId");
	const suiClient = useSuiClient();
	const {
		mutate: signAndExecute,
	} = useSignAndExecuteTransaction();

	const {
		mutate: sign,
	} = useSignTransaction();

	const [isCreating, setIsCreating] = React.useState(false);

	const SNT_TYPE = '0x688d228d71ac725d9f308fa6be32d014df2a6756394bf950783c603723ada55::snt::SNT';
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

	const parseHexString = (hexString: string): Uint8Array => {
		const sanitizedHex = hexString.replace(/\s+/g, "").toLowerCase();
		if (sanitizedHex.length % 2 !== 0) {
			throw new Error("Hex string must have an even number of characters");
		}
		if (!/^[0-9a-f]*$/.test(sanitizedHex)) {
			throw new Error("Hex string contains invalid characters");
		}

		const byteCount = sanitizedHex.length / 2;
		const bytes = new Uint8Array(byteCount);
		for (let i = 0; i < byteCount; i++) {
			const byteHex = sanitizedHex.substr(i * 2, 2);
			bytes[i] = parseInt(byteHex, 16);
		}

		return bytes;
	}

	const verify = async () => {
		if (!currentAccount) {
			return;
		}

		const tx = new Transaction();

		for (let i = 0; i < 1; i++) {
			let pk = "5ded23a41eb84ec1f95b27d14222155f145a45e76a6377ae9cfcf754a4da9956"
			let msg = "558c856fff2f137b3a6359796e9c545c21cbf1c4ddcd7768b3d24f79ec1ab3d7558c856fff2f137b3a6359796e9c545c21cbf1c4ddcd7768b3d24f79ec1ab3d7558c856fff2f137b3a6359796e9c545c21cbf1c4ddcd7768b3d24f79ec1ab3d70000000000000000"
			let sig1 = "8fac89c78d20cac21ba1e05115f40340dd9779f4f339903a6d99dcc2038221d7f704fa83012eb99b36d0e4c75c8cdd6a2e6d6c6c9c17a90f21f56b68f8545d04"
			let sig2 = "4a27dee562b8522f26a8b5600367a4e0b4673f5731d8fd3b3e30ad91e3f5adf93825f9d2a1a3670d24a82ba137026b06a4b60dbffc7251b30e5005cf545d7204"
			let pk_b = parseHexString(pk);
			let msg_b = parseHexString(msg);
			let sig_b = parseHexString(sig2);

			tx.moveCall({
				arguments: [
					tx.object(TESTNET_COUNTER_FUND_ID), 
					tx.pure.vector('u8', pk_b), 
					tx.pure.vector('u8', msg_b), 
					tx.pure.vector('u8', sig_b)],
				target: `${counterPackageId}::fund::apply_cheque`,
			});
		}

		setIsCreating(true);

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
					setIsCreating(false);
				},
				onError: (error) => {
					alert("Error: " + error);
					setIsCreating(false);
				}

			},
		);
	}


	const toHex = (byteArray: Uint8Array) => {
		return Array.from(byteArray, (byte: number) => {
			return ('0' + (byte & 0xff).toString(16)).slice(-2);
		}).join(' ');
	}


	const create = async () => {
		if (!currentAccount) {
			return;
		}

		const tx = new Transaction();


		const coin = await prepareCoin(currentAccount, tx, SNT_TYPE, 2000000000n);
		console.log('coin', coin);
		// if coin is a DError
		if ('errorMessage' in coin) {
			alert('Error: ' + coin.errorMessage);
			return;
		}

		let refAddress = currentAccount.address;

		tx.moveCall({
			arguments: [tx.object(TESTNET_COUNTER_FUND_ID), tx.pure.address(refAddress), coin],
			target: `${counterPackageId}::suinotes::create_note`,
		});

		setIsCreating(true);

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

					console.log('effects', effects);
					let createdObjects = effects?.created;
					if (!createdObjects || createdObjects.length === 0) {
						alert("No object created");
						setIsCreating(false);
						return;
					}

					// find object with type Counter
					for (let i = 0; i < createdObjects.length; i++) {
						const obj = createdObjects[i];

						// Get Object By ID
						const data = await suiClient.getObject({
							id: obj.reference.objectId,
							options: {
								showType: true,
							},
						});

						if (data.data?.type === `${counterPackageId}::suinotes::Note`) {
							onCreated(obj.reference.objectId);
							setIsCreating(false);
							return;
						}
					}
					alert("No Counter object created");
					setIsCreating(false);
				},
				onError: (error) => {
					alert("Error: " + error);
					setIsCreating(false);
				}

			},
		);
	}

	return (
		<Container>
			<Button
				size="3"
				onClick={() => {
					verify();
				}}
				disabled={isCreating}
			>
				{isCreating ? <ClipLoader size={20} /> : "Create Note"}
			</Button>
		</Container>
	);
}