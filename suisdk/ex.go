package suisdk

import (
	"encoding/base64"
	"encoding/hex"
	"fmt"

	"github.com/fardream/go-bcs/bcs"
)

func Exec() {
	fmt.Println("started")
	cl := NewClient(MAINNET_URL)

	var params MoveCallParameters
	params.PackageId = "0xbe66e3956632c8b8cb90211ecb329b9bb03afef9ba5d72472a7c240d3afe19fd"
	params.ModuleName = "example"
	params.FunctionName = "ex1"
	params.Arguments = []interface{}{}

	res, err := cl.ExecMoveCall(params)
	if err != nil {
		fmt.Println("ERROR:", err)
		return
	}

	if res == nil {
		fmt.Println("ERROR: nil result")
		return
	}

	fmt.Println("SUCCESS:", res.Digest)
}

type BBB struct {
	AAA string
}

func BCS() {
	c := NewClient(MAINNET_URL)
	gasBudget := uint64(100000000)
	gasCoinObjId := c.GetGasCoinObjId(gasBudget)

	var params MoveCallParameters
	params.PackageId = "0xbe66e3956632c8b8cb90211ecb329b9bb03afef9ba5d72472a7c240d3afe19fd"
	params.ModuleName = "example"
	params.FunctionName = "ex1"
	params.Arguments = []interface{}{}

	// Prepare TxBytes
	txBytes, err := c.UnsafeMoveCall(gasCoinObjId, fmt.Sprint(gasBudget), params.PackageId, params.ModuleName, params.FunctionName, params.Arguments)
	if err != nil {
		fmt.Println("ERROR:", err)
		return
	}

	bs, err := base64.StdEncoding.DecodeString(txBytes.TxBytes)
	if err != nil {
		fmt.Println("ERROR:", err)
		return
	}

	// HEX:  0000000100be66e3956632c8b8cb90211ecb329b9bb03afef9ba5d72472a7c240d3afe19fd076578616d706c6503657831000024789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766018063aea9684219ac3e72198e6c7b0d86b25c745959c075f7cde6ff8dc43f3cd7859e2a1c0000000020e677b6572e3065768d769ee025657eb2b79ddd48d35043b1859d81443645667124789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766ee0200000000000000e1f5050000000000

	// ADDRESS: 0x24789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766
	// GAS OBJ: 0x8063aea9684219ac3e72198e6c7b0d86b25c745959c075f7cde6ff8dc43f3cd7

	// HEX:
	/*
		0000000100

		be66e3956632c8b8cb90211ecb329b9bb03afef9ba5d72472a7c240d3afe19fd - PackageID
		076578616d706c65 - example
		03657831 - ex1

		0000 - unknown

		24789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766 - Signer Address - Sender

		GasData:

		01 - unknown - maybe payment count

		// ObjectRef = (ObjectID, SequenceNumber, ObjectDigest);

		8063aea9684219ac3e72198e6c7b0d86b25c745959c075f7cde6ff8dc43f3cd7 - gas obj id
		859e2a1c00000000 - gas obj version
		20 - unknown - gas obj sequence number
		e677b6572e3065768d769ee025657eb2b79ddd48d35043b1859d814436456671 - gas obj gidest

		24789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766 - gas obj owner
		ee02000000000000 - 750 price
		00e1f50500000000 - 100 000 000 - budget

		00 - unknown - TransactionExpiration
	*/
	/*
		pub struct TransactionDataV1 {
			pub kind: TransactionKind,
			pub sender: SuiAddress,
			pub gas_data: GasData,
			pub expiration: TransactionExpiration,
		}

		pub enum TransactionKind {
			/// A transaction that allows the interleaving of native commands and Move calls
			ProgrammableTransaction(ProgrammableTransaction),
			/// A system transaction that will update epoch information on-chain.
			/// It will only ever be executed once in an epoch.
			/// The argument is the next epoch number, which is critical
			/// because it ensures that this transaction has a unique digest.
			/// This will eventually be translated to a Move call during execution.
			/// It also doesn't require/use a gas object.
			/// A validator will not sign a transaction of this kind from outside. It only
			/// signs internally during epoch changes.
			///
			/// The ChangeEpoch enumerant is now deprecated (but the ChangeEpoch struct is still used by
			/// EndOfEpochTransaction below).
			ChangeEpoch(ChangeEpoch),
			Genesis(GenesisTransaction),
			ConsensusCommitPrologue(ConsensusCommitPrologue),
			AuthenticatorStateUpdate(AuthenticatorStateUpdate),

			/// EndOfEpochTransaction replaces ChangeEpoch with a list of transactions that are allowed to
			/// run at the end of the epoch.
			EndOfEpochTransaction(Vec<EndOfEpochTransactionKind>),

			RandomnessStateUpdate(RandomnessStateUpdate),
			// V2 ConsensusCommitPrologue also includes the digest of the current consensus output.
			ConsensusCommitPrologueV2(ConsensusCommitPrologueV2),

			ConsensusCommitPrologueV3(ConsensusCommitPrologueV3),
			// .. more transaction types go here
		}

		pub struct SuiAddress(
			#[schemars(with = "Hex")]
			#[serde_as(as = "Readable<Hex, _>")]
			[u8; SUI_ADDRESS_LENGTH],
		);

		pub struct GasData {
			pub payment: Vec<ObjectRef>,
			pub owner: SuiAddress,
			pub price: u64,
			pub budget: u64,
		}

		pub type ObjectRef = (ObjectID, SequenceNumber, ObjectDigest);
		pub struct SequenceNumber(u64);
		pub struct Digest(
			#[schemars(with = "Base58")]
			#[serde_as(as = "Readable<Base58, Bytes>")]
			[u8; 32],
		);

		pub enum TransactionExpiration {
			/// The transaction has no expiration
			None,
			/// Validators wont sign a transaction unless the expiration Epoch
			/// is greater than or equal to the current epoch
			Epoch(EpochId),
		}

	*/

	bsHex := hex.EncodeToString(bs)
	fmt.Println("HEX: ", bsHex)

	type TData struct {
	}
	var data TData
	n, err := bcs.Unmarshal(bs, &data)
	if err != nil {
		fmt.Println("ERROR:", err)
		return
	}
	fmt.Println("SUCCESS: ", n)
	fmt.Println("SUCCESS: ", data)
}
