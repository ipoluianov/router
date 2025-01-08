package suisdk

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
)

type Client struct {
	rpcURL  string
	account *Account
}

func NewClient(rpcURL string) *Client {
	var c Client
	c.rpcURL = rpcURL
	c.account, _ = NewAccountFromMnemonic("reveal resist nothing diary romance toe immense then spirit nut problem hawk")
	return &c
}

type RPCRequest struct {
	JSONRPC string        `json:"jsonrpc"`
	ID      int           `json:"id"`
	Method  string        `json:"method"`
	Params  []interface{} `json:"params"`
}

type RPCResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      int             `json:"id"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *RPCError       `json:"error,omitempty"`
}

type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (c *Client) rpcCall(request RPCRequest) (response *RPCResponse, err error) {
	requestJSON, err := json.Marshal(request)
	if err != nil {
		return
	}

	resp, err := http.Post(c.rpcURL, "application/json", bytes.NewBuffer(requestJSON))
	if err != nil {
		return
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return
	}

	err = json.Unmarshal(responseBody, &response)
	if err != nil {
		return
	}

	return
}
