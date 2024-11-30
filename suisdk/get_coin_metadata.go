package suisdk

import "encoding/json"

func (c *Client) GetCoinMetadata(coinType string) (coinMetadata SuiCoinMetadata, err error) {
	requestBody := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "suix_getCoinMetadata",
		Params:  []interface{}{coinType},
	}

	if coinType != "" {
		requestBody.Params = append(requestBody.Params, coinType)
	}

	res, err := c.rpcCall(requestBody)
	if err != nil {
		return
	}

	err = json.Unmarshal(res.Result, &coinMetadata)

	return
}
