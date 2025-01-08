package suisdk

import (
	"encoding/json"
)

type GetObjectShowOptions struct {
	ShowType                bool `json:"showType"`
	ShowOwner               bool `json:"showOwner"`
	ShowPreviousTransaction bool `json:"showPreviousTransaction"`
	ShowDisplay             bool `json:"showDisplay"`
	ShowContent             bool `json:"showContent"`
	ShowBcs                 bool `json:"showBcs"`
	ShowStorageRebate       bool `json:"showStorageRebate"`
}

type ObjectRequestFilter struct {
	MatchAll []map[string]string `json:"MatchAll,omitempty"`
}

type ObjectResponseQuery struct {
	Options GetObjectShowOptions `json:"options"`
	Filter  *ObjectRequestFilter `json:"filter,omitempty"`
}

func (c *ObjectResponseQuery) AddMatchStructType(structType string) {
	if c.Filter == nil {
		c.Filter = &ObjectRequestFilter{}
	}

	c.Filter.MatchAll = append(c.Filter.MatchAll, map[string]string{"StructType": structType})
}

func (c *Client) GetOwnedObjects(address string, cursor string, limit uint, query ObjectResponseQuery) (response ObjectsPage, err error) {
	requestBody := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "suix_getOwnedObjects",
		Params: []interface{}{
			address,
			query,
		},
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
