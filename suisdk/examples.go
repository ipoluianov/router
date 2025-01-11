package suisdk

import (
	"encoding/base64"
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
	// 010000000000000100be66e3956632c8b8cb90211ecb329b9bb03afef9ba5d72472a7c240d3afe19fd076578616d706c6503657831000024789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766018063aea9684219ac3e72198e6c7b0d86b25c745959c075f7cde6ff8dc43f3cd7849e2a1c00000000203f0bb2bc37b197ed81a70a12476d500a5c3e431938c46d47361fcf137da2369f24789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766ee0200000000000000e1f5050000000000016100357f4e9eea949571ac3f3b71930fac662bdc7b47fe8348381463554a85c1228532b31d0108b5405218e33a380ab7b1f5135b8266e0b34f692b6bfff8ab5a74084acbf07fd16933e3e4c6a47833f659e80724030d595d483ad7da29dc0d32eb5c
	bs, err := hex.DecodeString("0000010101261fb14f034bf488b8bfdeb263f081b5073883269368e258852f34deeae205d2709e2a1c00000000010100be66e3956632c8b8cb90211ecb329b9bb03afef9ba5d72472a7c240d3afe19fd0466756e6403657832000101000024789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c647660172270e5d67cf2e1d87d864feac1a5db9bc26eee39b034e124437c65ff04a1dd70b98e21a00000000204e0d868967368a5220200500345a7dfe8d756ee563d1220168171584d417861d24789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766ee0200000000000000e1f5050000000000")
	if err != nil {
		fmt.Println("ERROR:", err)
		return
	}

	fmt.Println("bs:", hex.EncodeToString(bs))

	trData := &transactiondata.TransactionData{}
	_, err = trData.Parse(bs, 0)

	if err != nil {
		fmt.Println("ERROR:", err, trData)
		return
	}

	bsJson, _ := json.MarshalIndent(trData, "", "  ")
	fmt.Println("SUCCESS:")
	fmt.Println(string(bsJson))
}

func ExampleGetTransactionBlock() {
	cl := NewClient(MAINNET_URL)
	var showParams TransactionBlockResponseOptions
	showParams.ShowRawInput = true
	dig := "CWYj4F1vW34BwYBVAkFJXKRyoBHhQhenY89g6GvaKjSu"
	b, err := cl.GetTransactionBlock(dig, showParams)
	if err != nil {
		fmt.Println("ERROR:", err)
		return
	}
	fmt.Println("SUCCESS")
	fmt.Println(b.RawTransaction)

	bs, err := base64.StdEncoding.DecodeString(b.RawTransaction)
	if err != nil {
		fmt.Println("ERROR:", err)
		return
	}
	hexBS := hex.EncodeToString(bs)
	fmt.Println(hexBS)

	fmt.Println()
	fmt.Println()
	fmt.Println()

	var block transactiondata.Envelope
	_, err = block.Parse(bs, 0)
	if err != nil {
		fmt.Println("ERROR:", err)
		return
	}

	fmt.Println("SUCCESS", block)

	jsonBS, _ := json.MarshalIndent(block, "", "  ")
	fmt.Println(string(jsonBS))

	fmt.Println("TRANSACTION" + dig)
	fmt.Println("SENDER:", block.TransactionDataWithIntent.Data.V1.Sender)
	fmt.Println("GASDATA:", block.TransactionDataWithIntent.Data.V1.GasData)
	//fmt.Println("KIND:", block.TransactionDataWithIntent.Data.V1.Kind)
	if block.TransactionDataWithIntent.Data.V1.Kind.ProgrammableTransaction == nil {
		fmt.Println("ERROR: ProgrammableTransaction is nil")
		return
	}
	fmt.Println("COMMANDS:")
	for _, c := range block.TransactionDataWithIntent.Data.V1.Kind.ProgrammableTransaction.Commands {
		fmt.Println("  ", c)
	}

	// 01
	// 000000
	// 0000000100
	// be66e3956632c8b8cb90211ecb329b9bb03afef9ba5d72472a7c240d3afe19fd076578616d706c6503657831000024789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766018063aea9684219ac3e72198e6c7b0d86b25c745959c075f7cde6ff8dc43f3cd7849e2a1c00000000203f0bb2bc37b197ed81a70a12476d500a5c3e431938c46d47361fcf137da2369f24789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766ee0200000000000000e1f5050000000000016100357f4e9eea949571ac3f3b71930fac662bdc7b47fe8348381463554a85c1228532b31d0108b5405218e33a380ab7b1f5135b8266e0b34f692b6bfff8ab5a74084acbf07fd16933e3e4c6a47833f659e80724030d595d483ad7da29dc0d32eb5c
}
