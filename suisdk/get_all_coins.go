package suisdk

import (
	"encoding/json"
)

type Item struct {
	CoinType            string `json:"coinType"`
	Version             string `json:"version"`
	Digest              string `json:"digest"`
	Balance             string `json:"balance"`
	PreviousTransaction string `json:"previousTransaction"`
}

/*
"coinType": "0x2::sui::SUI",
        "coinObjectId": "0x91825debff541cf4e08b5c5f7296ff9840e6f0b185af93984cde8cf3870302c0",
        "version": "103626",
        "digest": "7dp5WtTmtGp83EXYYFMzjBJRFeSgR67AzqMETLrfgeFx",
        "balance": "200000000",
        "previousTransaction": "9WfFUVhjbbh4tWkyUse1QxzbKX952cyXScH7xJNPB2vQ"
*/

type GetAllCoinsReponse struct {
	Data        []Item `json:"data"`
	HasNextPage bool   `json:"hasNextPage"`
	NextCursor  string `json:"nextCursor"`
}

func (c *Client) GetAllCoins(address string, cursor string, limit uint) (response GetAllCoinsReponse, err error) {
	requestBody := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "suix_getAllCoins",
		Params:  []interface{}{address},
	}

	if cursor != "" {
		requestBody.Params = append(requestBody.Params, cursor)
	}

	if limit != 0 {
		requestBody.Params = append(requestBody.Params, limit)
	}

	res, err := c.rpcCall(requestBody)

	if err != nil {
		return
	}

	err = json.Unmarshal(res.Result, &response)
	return
}
