package suisdk

import (
	"encoding/json"
)

// TODO: locked balance
type Balance struct {
	CoinType        string `json:"coinType"`
	CoinObjectCount int    `json:"coinObjectCount"`
	TotalBalance    string `json:"totalBalance"`
}

func (c *Client) GetAllBalances(address string) (balances []Balance, err error) {
	requestBody := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "suix_getAllBalances",
		Params:  []interface{}{address},
	}

	res, err := c.rpcCall(requestBody)
	if err != nil {
		return
	}

	balances = make([]Balance, 0)
	err = json.Unmarshal(res.Result, &balances)

	return
}
