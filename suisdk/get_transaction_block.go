package suisdk

import (
	"encoding/json"
	"fmt"
)

/*
balanceChanges	array | null	No
checkpoint
BigInt_for_uint64 | null
No	The checkpoint number when this transaction was included and hence finalized. This is only returned in the read api, not in the transaction execution api.
confirmedLocalExecution	boolean | null	No
digest	TransactionDigest	Yes
effects
TransactionBlockEffects | null
No
errors	array	No
events	array | null	No
objectChanges	array | null	No
rawEffects	array	No
rawTransaction
Base64

No	BCS encoded [SenderSignedData] that includes input object references returns empty array if `show_raw_transaction` is false
timestampMs
BigInt_for_uint64 | null
No
transaction
TransactionBlock | null
No	Transaction input data
*/

type TransactionBlockResponse struct {
	Digest         string           `json:"digest"`
	TimestampMs    string           `json:"timestampMs"`
	CheckPoint     string           `json:"checkpoint"`
	Transaction    TransactionBlock `json:"transaction"`
	RawTransaction string           `json:"rawTransaction"`
}

func (c *Client) GetTransactionBlock(digest string, showParams TransactionBlockResponseOptions) (response TransactionBlockResponse, err error) {
	requestBody := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "sui_getTransactionBlock",
		Params:  []interface{}{digest, showParams},
	}

	res, err := c.rpcCall(requestBody)

	if err != nil {
		return
	}

	fmt.Println(string(res.Result))

	err = json.Unmarshal(res.Result, &response)
	return
}
