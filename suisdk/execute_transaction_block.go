package suisdk

import (
	"encoding/json"
	"errors"
)

type TransactionExecutionResult struct {
	Digest      string `json:"digest"`
	Transaction struct {
		Data struct {
			MessageVersion string `json:"messageVersion"`
			Transaction    struct {
				Kind         string        `json:"kind"`
				Inputs       []interface{} `json:"inputs"`
				Transactions []struct {
					MoveCall struct {
						Package  string `json:"package"`
						Module   string `json:"module"`
						Function string `json:"function"`
					} `json:"MoveCall"`
				} `json:"transactions"`
			} `json:"transaction"`
			Sender  string `json:"sender"`
			GasData struct {
				Payment []struct {
					ObjectId string `json:"objectId"`
					Version  int    `json:"version"`
					Digest   string `json:"digest"`
				} `json:"payment"`
				Owner  string `json:"owner"`
				Price  string `json:"price"`
				Budget string `json:"budget"`
			} `json:"gasData"`
		} `json:"data"`
		TxSignatures []string `json:"txSignatures"`
	} `json:"transaction"`
	RawTransaction string `json:"rawTransaction"`
	Effects        struct {
		MessageVersion string `json:"messageVersion"`
		Status         struct {
			Status string `json:"status"`
		} `json:"status"`
		ExecutedEpoch string `json:"executedEpoch"`
		GasUsed       struct {
			ComputationCost         string `json:"computationCost"`
			StorageCost             string `json:"storageCost"`
			StorageRebate           string `json:"storageRebate"`
			NonRefundableStorageFee string `json:"nonRefundableStorageFee"`
		} `json:"gasUsed"`
		ModifiedAtVersions []struct {
			ObjectId       string `json:"objectId"`
			SequenceNumber string `json:"sequenceNumber"`
		} `json:"modifiedAtVersions"`
		TransactionDigest string `json:"transactionDigest"`
		Mutated           []struct {
			Owner struct {
				AddressOwner string `json:"AddressOwner"`
			} `json:"owner"`
			Reference struct {
				ObjectId string `json:"objectId"`
				Version  int    `json:"version"`
				Digest   string `json:"digest"`
			} `json:"reference"`
		} `json:"mutated"`
		GasObject struct {
			Owner struct {
				AddressOwner string `json:"AddressOwner"`
			} `json:"owner"`
			Reference struct {
				ObjectId string `json:"objectId"`
				Version  int    `json:"version"`
				Digest   string `json:"digest"`
			} `json:"reference"`
		} `json:"gasObject"`
		Dependencies []string `json:"dependencies"`
	} `json:"effects"`
	Events        []interface{} `json:"events"`
	ObjectChanges []struct {
		Type   string `json:"type"`
		Sender string `json:"sender"`
		Owner  struct {
			AddressOwner string `json:"AddressOwner"`
		} `json:"owner"`
		ObjectType      string `json:"objectType"`
		ObjectId        string `json:"objectId"`
		Version         string `json:"version"`
		PreviousVersion string `json:"previousVersion"`
		Digest          string `json:"digest"`
	} `json:"objectChanges"`
	BalanceChanges []struct {
		Owner struct {
			AddressOwner string `json:"AddressOwner"`
		} `json:"owner"`
		CoinType string `json:"coinType"`
		Amount   string `json:"amount"`
	} `json:"balanceChanges"`
	ConfirmedLocalExecution bool   `json:"confirmedLocalExecution"`
	RawEffects              []byte `json:"rawEffects"`
}

func (c *Client) ExecuteTransactionBlock(txBytes string, signature string) (*TransactionExecutionResult, error) {
	var options TransactionBlockResponseOptions

	options.ShowEffects = true
	options.ShowInput = true
	options.ShowRawInput = true
	options.ShowEvents = true
	options.ShowObjectChanges = true
	options.ShowBalanceChanges = true
	options.ShowRawEffects = true

	requestBody := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "sui_executeTransactionBlock",
		Params: []interface{}{
			txBytes,
			[]string{signature},
			options,
		},
	}

	res, err := c.rpcCall(requestBody)
	if err != nil {
		return nil, err
	}

	if res.Error != nil {
		return nil, errors.New(res.Error.Message)
	}

	var result TransactionExecutionResult
	bs, _ := json.MarshalIndent(res.Result, "", "  ")
	json.Unmarshal(bs, &result)
	return &result, nil
}
