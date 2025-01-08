package suisdk

import (
	"fmt"
)

func Exec() {
	fmt.Println("started")
	cl := NewClient(MAINNET_URL)

	var params MoveCallParameters
	params.PackageId = "0xbe66e3956632c8b8cb90211ecb329b9bb03afef9ba5d72472a7c240d3afe19fd"
	params.ModuleName = "example"
	params.FunctionName = "ex1"

	res, err := cl.ExecMoveCall(params)
	if err != nil {
		fmt.Println("ERROR:", err)
		return
	}

	fmt.Println("SUCCESS:", res.Digest)
}
