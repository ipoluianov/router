package suisdk

import "encoding/json"

func (c *Client) GetCoins(address string, cursor string, limit uint) (response GetAllCoinsReponse, err error) {
	requestBody := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "suix_getCoins",
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
