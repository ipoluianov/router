package main

import (
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"

	"github.com/ipoluianov/router/suisdk"
)

func main() {
	cl := suisdk.NewClient(suisdk.TESTNET_URL)

	var p suisdk.TransactionBlockResponseOptions
	p.ShowInput = true
	p.ShowRawInput = true
	p.ShowEffects = false
	p.ShowEvents = false
	p.ShowObjectChanges = false
	p.ShowBalanceChanges = false
	p.ShowRawEffects = false

	res, _ := cl.GetTransactionBlock("35viqvWEus3zdYfZCfiiGiFjwZYHN6KxCiQAfvV1eGH6", p)
	bs, _ := json.MarshalIndent(res, "", "  ")
	fmt.Println(string(bs))

	rawTrans, _ := base64.StdEncoding.DecodeString(res.RawTransaction)

	h := hex.EncodeToString([]byte(rawTrans))
	fmt.Println(h)
}
