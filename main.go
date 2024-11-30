package main

import (
	"encoding/json"
	"fmt"

	"github.com/ipoluianov/router/suisdk"
)

func main() {
	cl := suisdk.NewClient(suisdk.TESTNET_URL)
	resp, err := cl.GetTotalSupply("0x0688d228d71ac725d9f308fa6be32d014df2a6756394bf950783c603723ada55::snt::SNT")
	bs, _ := json.MarshalIndent(resp, "", "  ")
	if err != nil {
		panic(err)
	}
	fmt.Println(string(bs))
}
