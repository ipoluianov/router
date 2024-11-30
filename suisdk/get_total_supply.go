package suisdk

import (
	"encoding/json"
)

func (c *Client) GetTotalSupply(coinType string) (totalSupply string, err error) {
	requestBody := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "suix_getTotalSupply",
		Params:  []interface{}{coinType},
	}

	res, err := c.rpcCall(requestBody)
	if err != nil {
		return
	}

	type Result struct {
		Value string `json:"value"`
	}
	var r Result

	err = json.Unmarshal(res.Result, &r)
	if err != nil {
		return
	}

	totalSupply = r.Value

	return
}
