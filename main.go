package main

import (
	"context"
	"crypto"
	"encoding/hex"
	"fmt"

	"github.com/block-vision/sui-go-sdk/models"
	"github.com/block-vision/sui-go-sdk/signer"
	"github.com/block-vision/sui-go-sdk/sui"
	"github.com/block-vision/sui-go-sdk/utils"
)

func main() {
	var ctx = context.Background()
	var cli = sui.NewSuiClient("https://fullnode.testnet.sui.io:443")

	signerAccount, err := signer.NewSignertWithMnemonic("reveal resist nothing diary romance toe immense then spirit nut problem hawk")

	if err != nil {
		fmt.Println(err.Error())
		return
	}

	priKey := signerAccount.PriKey
	fmt.Printf("signerAccount.Address: %s\n", signerAccount.Address)

	gasObj := "0x558c856fff2f137b3a6359796e9c545c21cbf1c4ddcd7768b3d24f79ec1ab3d7"

	publicKeyAsBytes := "0x" + hex.EncodeToString(signerAccount.PubKey)
	msg := []byte{0, 1, 2}
	msgHex := "0x" + hex.EncodeToString(msg)
	var noHash crypto.Hash
	signature, err := priKey.Sign(nil, msg, noHash)
	if err != nil {
		fmt.Println("ERROR:", err.Error())
		return
	}

	sigHex := "0x" + hex.EncodeToString(signature)

	fmt.Println("publicKeyAsBytes:", publicKeyAsBytes)
	fmt.Println("msgHex:", msgHex)
	fmt.Println("signature:", sigHex)

	rsp, err := cli.MoveCall(ctx, models.MoveCallRequest{
		Signer:          signerAccount.Address,
		PackageObjectId: "0xf1fddd6626adb09affd57e5fb0f3e32cb06f0943d10d0136a48628bee396e211",
		Module:          "fund",
		Function:        "verify_signature",
		TypeArguments:   []interface{}{},
		Arguments: []interface{}{
			publicKeyAsBytes,
			msgHex,
			sigHex,
		},
		Gas:       &gasObj,
		GasBudget: "100000000",
	})

	if err != nil {
		fmt.Println("ERROR:", err.Error())
		return
	}

	// see the successful transaction url: https://explorer.sui.io/txblock/CD5hFB4bWFThhb6FtvKq3xAxRri72vsYLJAVd7p9t2sR?network=testnet
	rsp2, err := cli.SignAndExecuteTransactionBlock(ctx, models.SignAndExecuteTransactionBlockRequest{
		TxnMetaData: rsp,
		PriKey:      priKey,
		// only fetch the effects field
		Options: models.SuiTransactionBlockOptions{
			ShowInput:    true,
			ShowRawInput: true,
			ShowEffects:  true,
		},
		RequestType: "WaitForLocalExecution",
	})

	if err != nil {
		fmt.Println(err.Error())
		return
	}

	utils.PrettyPrint(rsp2)
}
