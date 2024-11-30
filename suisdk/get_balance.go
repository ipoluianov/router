package suisdk

import "encoding/json"

func (c *Client) GetBalance(address string, coinType string) (balance Balance, err error) {
	requestBody := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "suix_getBalance",
		Params:  []interface{}{address},
	}

	if coinType != "" {
		requestBody.Params = append(requestBody.Params, coinType)
	}

	res, err := c.rpcCall(requestBody)
	if err != nil {
		return
	}

	err = json.Unmarshal(res.Result, &balance)

	return
}
