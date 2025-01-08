package suisdk

import (
	"encoding/json"
	"errors"
)

/*
{
  "effects": {
    "messageVersion": "v1",
    "status": {
      "status": "success"
    },
    "executedEpoch": "637",
    "gasUsed": {
      "computationCost": "750000",
      "storageCost": "988000",
      "storageRebate": "978120",
      "nonRefundableStorageFee": "9880"
    },
    "modifiedAtVersions": [
      {
        "objectId": "0x8063aea9684219ac3e72198e6c7b0d86b25c745959c075f7cde6ff8dc43f3cd7",
        "sequenceNumber": "472555141"
      }
    ],
    "transactionDigest": "2bCYrHmzTZ2vpw8b276CYDdWgVstZkoBE4nSdbnBA8PY",
    "mutated": [
      {
        "owner": {
          "AddressOwner": "0x24789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766"
        },
        "reference": {
          "objectId": "0x8063aea9684219ac3e72198e6c7b0d86b25c745959c075f7cde6ff8dc43f3cd7",
          "version": 472555142,
          "digest": "84jpbm7UbkZHmrw2ZQbCMkbaJSvHQtyYsDaMWTjft43n"
        }
      }
    ],
    "gasObject": {
      "owner": {
        "AddressOwner": "0x24789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766"
      },
      "reference": {
        "objectId": "0x8063aea9684219ac3e72198e6c7b0d86b25c745959c075f7cde6ff8dc43f3cd7",
        "version": 472555142,
        "digest": "84jpbm7UbkZHmrw2ZQbCMkbaJSvHQtyYsDaMWTjft43n"
      }
    },
    "dependencies": [
      "8zDZ3NmtgVvzCBYdzVMgjVe4evES72Yov2ftRjDtKXTN",
      "GZbKjmRek2Tj72ogAVaLCGsEAiEbDqqsLkFdLdj4ab8e"
    ]
  },
  "events": [],
  "objectChanges": [
    {
      "type": "mutated",
      "sender": "0x24789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766",
      "owner": {
        "AddressOwner": "0x24789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766"
      },
      "objectType": "0x2::coin::Coin\u003c0x2::sui::SUI\u003e",
      "objectId": "0x8063aea9684219ac3e72198e6c7b0d86b25c745959c075f7cde6ff8dc43f3cd7",
      "version": "472555142",
      "previousVersion": "472555141",
      "digest": "84jpbm7UbkZHmrw2ZQbCMkbaJSvHQtyYsDaMWTjft43n"
    }
  ],
  "balanceChanges": [
    {
      "owner": {
        "AddressOwner": "0x24789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766"
      },
      "coinType": "0x2::sui::SUI",
      "amount": "-759880"
    }
  ],
  "input": {
    "messageVersion": "v1",
    "transaction": {
      "kind": "ProgrammableTransaction",
      "inputs": [],
      "transactions": [
        {
          "MoveCall": {
            "package": "0xbe66e3956632c8b8cb90211ecb329b9bb03afef9ba5d72472a7c240d3afe19fd",
            "module": "example",
            "function": "ex1"
          }
        }
      ]
    },
    "sender": "0x24789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766",
    "gasData": {
      "payment": [
        {
          "objectId": "0x8063aea9684219ac3e72198e6c7b0d86b25c745959c075f7cde6ff8dc43f3cd7",
          "version": 472555141,
          "digest": "GWeePWQPrAHFamvubVg6WZJvRq36o223cmXpu3ZBcmfE"
        }
      ],
      "owner": "0x24789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766",
      "price": "750",
      "budget": "100000000"
    }
  }
}
*/

type DryRunTransactionBlockResponse struct {
	Effects struct {
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
	Input struct {
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
	} `json:"input"`
}

func (c *Client) DryRunTransactionBlock(txBytes string) (*DryRunTransactionBlockResponse, error) {

	requestBody := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "sui_dryRunTransactionBlock",
		Params: []interface{}{
			txBytes,
		},
	}

	res, err := c.rpcCall(requestBody)
	if err != nil {
		return nil, err
	}

	if res.Error != nil {
		return nil, errors.New(res.Error.Message)
	}

	//bsRes, _ := json.MarshalIndent(res.Result, "", "  ")
	//fmt.Println(string(bsRes))

	var result DryRunTransactionBlockResponse
	bs, _ := json.MarshalIndent(res.Result, "", "  ")
	json.Unmarshal(bs, &result)
	return &result, nil
}
