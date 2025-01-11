package suisdk

import (
	"encoding/hex"
	"encoding/json"
	"fmt"

	"github.com/ipoluianov/router/transactiondata"
)

func Exec() {
	fmt.Println("started")
	cl := NewClient(MAINNET_URL)

	var params MoveCallParameters
	params.PackageId = "0xbe66e3956632c8b8cb90211ecb329b9bb03afef9ba5d72472a7c240d3afe19fd"
	params.ModuleName = "example"
	params.FunctionName = "ex1"
	params.Arguments = []interface{}{}

	res, err := cl.ExecMoveCall(params)
	if err != nil {
		fmt.Println("ERROR:", err)
		return
	}

	if res == nil {
		fmt.Println("ERROR: nil result")
		return
	}

	fmt.Println("SUCCESS:", res.Digest)
}

func BCS() {
	bs, err := hex.DecodeString("0000010101261fb14f034bf488b8bfdeb263f081b5073883269368e258852f34deeae205d2709e2a1c00000000010100be66e3956632c8b8cb90211ecb329b9bb03afef9ba5d72472a7c240d3afe19fd0466756e6403657832000101000024789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c647660172270e5d67cf2e1d87d864feac1a5db9bc26eee39b034e124437c65ff04a1dd70b98e21a00000000204e0d868967368a5220200500345a7dfe8d756ee563d1220168171584d417861d24789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766ee0200000000000000e1f5050000000000")
	if err != nil {
		fmt.Println("ERROR:", err)
		return
	}
	trData := transactiondata.NewTransactionData()
	_, err = trData.Parse(bs, 0)

	if err != nil {
		fmt.Println("ERROR:", err)
		return
	}

	bsJson, _ := json.MarshalIndent(trData, "", "  ")
	fmt.Println("SUCCESS:")
	fmt.Println(string(bsJson))
}
