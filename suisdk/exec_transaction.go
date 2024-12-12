package suisdk

import (
	"encoding/base64"
	"encoding/hex"
	"fmt"
)

func (c *Client) ExecTransaction() {
	txSigned := "AQAAAAAAAAEAGmXIAXaFMG3ViHLhWjHiu+9B6t+i1GkX4mzdXH/mP24Gc2ltcGxlBmNyZWF0ZQAAJHiUmN7rS4THPlhVSnORKixqI1iQWQOsaPmnKBjGR2YBa3+oNdGrNt7nFV0CfNrdY6cBAZ8WFKwuqjflpdQyxvCLVs8YAAAAACCEF52nJlsF+blRcz4LTkX2/ju3O3QGMvfI5JxNwOyxJiR4lJje60uExz5YVUpzkSosaiNYkFkDrGj5pygYxkdm7gIAAAAAAADA9iUAAAAAAAABYQDTpDMTsh6UOyqT5l96yeCQD0U/hzZ147qxrRpwVc+k+iqW0VX6jiiXo9fllDXlVrPQsP0+otJiIU7gn0nLwicCSsvwf9FpM+PkxqR4M/ZZ6AckAw1ZXUg619op3A0y61w="

	txSignedBin, _ := base64.StdEncoding.DecodeString(txSigned)
	msgBS := txSignedBin[4 : len(txSignedBin)-97-2]
	sigBS := txSignedBin[len(txSignedBin)-97:]
	txSignedHex := hex.EncodeToString(msgBS)
	fmt.Println("SIG HEX:", txSignedHex, len(msgBS))

	base64Signature := base64.StdEncoding.EncodeToString(sigBS)
	base64Msg := base64.StdEncoding.EncodeToString(msgBS)

	var showParams TransactionBlockResponseOptions
	showParams.ShowInput = true
	showParams.ShowRawInput = true
	showParams.ShowEffects = true
	showParams.ShowEvents = true
	showParams.ShowObjectChanges = true
	showParams.ShowBalanceChanges = true
	showParams.ShowRawEffects = false

	/*
		{
		      "showInput": true,
		      "showRawInput": true,
		      "showEffects": true,
		      "showEvents": true,
		      "showObjectChanges": true,
		      "showBalanceChanges": true,
		      "showRawEffects": false
		    },
		    "WaitForLocalExecution"
	*/

	requestBody := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "sui_executeTransactionBlock",
		Params: []interface{}{
			base64Msg,
			[]string{base64Signature},
			showParams,
			"WaitForLocalExecution",
		},
	}

	res, err := c.rpcCall(requestBody)
	if err != nil {
		fmt.Println(err)
		return
	}

	if res.Error != nil {
		fmt.Println("ERROR")
		fmt.Println(res.Error.Code, res.Error.Message)
		return
	}

	fmt.Println("OK")
	fmt.Println(string(res.Result))
}
