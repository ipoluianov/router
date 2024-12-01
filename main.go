package main

import (
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
}
