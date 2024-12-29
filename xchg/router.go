package xchg

import (
	"context"
	"crypto/ed25519"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/block-vision/sui-go-sdk/models"
	"github.com/block-vision/sui-go-sdk/signer"
	"github.com/block-vision/sui-go-sdk/sui"
	"github.com/block-vision/sui-go-sdk/utils"
	"github.com/ipoluianov/router/suisdk"
)

type RouterObject struct {
	Segment          uint32
	IpAddr           string
	Name             string
	Owner            string
	TotalStakeAmount string
	Rewards          string
	Cheques          []string
}

func GetRouterObject(routerXchgAddr string) (*RouterObject, error) {
	var c RouterObject
	fundObject, _ := GetFundObject()

	cl, signer := createClient()
	if cl == nil || signer == nil {
		return nil, errors.New("error creating client")
	}

	var req models.SuiXGetDynamicFieldObjectRequest
	req.ObjectId = fundObject.RoutersTableId
	req.DynamicFieldName.Type = "address"
	req.DynamicFieldName.Value = routerXchgAddr

	ctx := context.Background()

	res, err := cl.SuiXGetDynamicFieldObject(ctx, req)
	if err != nil {
		fmt.Println(err.Error())
		return nil, err
	}

	if res.Data == nil {
		fmt.Println("No router found")
		return nil, errors.New("no router found")
	}

	c.IpAddr = GetStringValueByPath(res.Data.Content.Fields, "value/fields/ipAddr")
	c.Segment = uint32(GetNumberValueByPath(res.Data.Content.Fields, "value/fields/segment"))
	c.Name = GetStringValueByPath(res.Data.Content.Fields, "value/fields/name")
	c.Owner = GetStringValueByPath(res.Data.Content.Fields, "value/fields/owner")
	c.TotalStakeAmount = GetStringValueByPath(res.Data.Content.Fields, "value/fields/totalStakeAmount")
	c.Rewards = GetStringValueByPath(res.Data.Content.Fields, "value/fields/rewards")

	vvv := getJsonValueByPath(res.Data.Content.Fields, "value/fields/chequeIds/fields/contents")
	for _, v := range vvv.([]interface{}) {
		c.Cheques = append(c.Cheques, v.(string))
	}

	return &c, nil
}

func (c *RouterObject) Digest() string {
	bs, _ := json.MarshalIndent(c, "", "    ")
	return string(bs)
}

func CreateChequesIDs(routerXchgAddress string) {
	var ctx = context.Background()
	var cli = sui.NewSuiClient(suisdk.TESTNET_URL)
	signerAccount, err := signer.NewSignertWithMnemonic("reveal resist nothing diary romance toe immense then spirit nut problem hawk")

	if err != nil {
		fmt.Println(err.Error())
		return
	}

	priKey := signerAccount.PriKey
	fmt.Printf("signerAccount.Address: %s\n", signerAccount.Address)

	gasObj := "0xd0c23ecbcb9e8997a1d22d220ed9c28beb93596dc9a310316a49acd0d7a3d6c5"

	rsp, err := cli.MoveCall(ctx, models.MoveCallRequest{
		Signer:          signerAccount.Address,
		PackageObjectId: PACKAGE_ID,
		Module:          "fund",
		Function:        "get_cheques_ids",
		TypeArguments:   []interface{}{},
		Arguments: []interface{}{
			FUND_OBJECT_ID,
			routerXchgAddress,
			1,
			"0x6",
		},
		Gas:       &gasObj,
		GasBudget: "100000000",
	})

	if err != nil {
		fmt.Println(err.Error())
		return
	}

	rsp2, err := cli.SignAndExecuteTransactionBlock(ctx, models.SignAndExecuteTransactionBlockRequest{
		TxnMetaData: rsp,
		PriKey:      priKey,
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

func ApplyCheque(chequeID string) {
	var ctx = context.Background()
	var cli = sui.NewSuiClient(suisdk.TESTNET_URL)
	signerAccount, err := signer.NewSignertWithMnemonic("reveal resist nothing diary romance toe immense then spirit nut problem hawk")

	if err != nil {
		fmt.Println(err.Error())
		return
	}

	priKey := signerAccount.PriKey
	fmt.Printf("signerAccount.Address: %s\n", signerAccount.Address)

	gasObj := "0xd0c23ecbcb9e8997a1d22d220ed9c28beb93596dc9a310316a49acd0d7a3d6c5"
	xchgMsg := make([]byte, 104)

	chequeIDBytes, _ := hex.DecodeString(chequeID[2:])

	// ChecqueID
	for i := 0; i < 32; i++ {
		xchgMsg[i] = chequeIDBytes[i]
	}

	// RouterAddress
	routerAddress, _ := hex.DecodeString("5ded23a41eb84ec1f95b27d14222155f145a45e76a6377ae9cfcf754a4da9956")
	for i, v := range routerAddress {
		xchgMsg[i+32] = byte(v)
	}

	// ApplicationID
	for i := 0; i < 32; i++ {
		xchgMsg[i+64] = 0
	}

	// Amount
	binary.LittleEndian.PutUint64(xchgMsg[96:], 1000)

	xchgPrivKey, _ := hex.DecodeString("a7dee35305a6a7984a0b16900d4adba8eb957c6bb8d71d36ea303f8eaec5d6be5ded23a41eb84ec1f95b27d14222155f145a45e76a6377ae9cfcf754a4da9956")
	xchgPublicKey, _ := hex.DecodeString("5ded23a41eb84ec1f95b27d14222155f145a45e76a6377ae9cfcf754a4da9956")
	//xchgMsg, _ := hex.DecodeString("558c856fff2f137b3a6359796e9c545c21cbf1c4ddcd7768b3d24f79ec1ab3d7558c856fff2f137b3a6359796e9c545c21cbf1c4ddcd7768b3d24f79ec1ab3d7558c856fff2f137b3a6359796e9c545c21cbf1c4ddcd7768b3d24f79ec1ab3d7000000000000000011111111")
	xchgSignature := ed25519.Sign(xchgPrivKey, xchgMsg)

	//xchgSignature, _ = hex.DecodeString("8fac89c78d20cac21ba1e05115f40340dd9779f4f339903a6d99dcc2038221d7f704fa83012eb99b36d0e4c75c8cdd6a2e6d6c6c9c17a90f21f56b68f8545d04")

	xchgPublicKeyArray := make([]int32, 32)
	for i, v := range xchgPublicKey {
		xchgPublicKeyArray[i] = int32(v)
	}

	xchgMsgArray := make([]int32, 104)
	for i, v := range xchgMsg {
		xchgMsgArray[i] = int32(v)
	}

	xchgSignatureArray := make([]uint32, 64)
	for i, v := range xchgSignature {
		xchgSignatureArray[i] = uint32(v)
	}

	fmt.Println(hex.EncodeToString(xchgPublicKey), len(xchgPublicKey))
	fmt.Println(hex.EncodeToString(xchgMsg), len(xchgMsg))
	fmt.Println(hex.EncodeToString(xchgSignature), len(xchgSignature))

	rsp, err := cli.MoveCall(ctx, models.MoveCallRequest{
		Signer:          signerAccount.Address,
		PackageObjectId: PACKAGE_ID,
		Module:          "fund",
		Function:        "apply_cheque",
		TypeArguments:   []interface{}{
			/*"address",
			"vector<u8>",
			"vector<u8>",
			"vector<u8>",*/
		},
		Arguments: []interface{}{
			FUND_OBJECT_ID,
			xchgPublicKeyArray,
			xchgMsgArray,
			xchgSignatureArray,
			CLOCK_OBJECT_ID,
		},
		Gas:       &gasObj,
		GasBudget: "10000000",
	})

	if err != nil {
		fmt.Println(err.Error())
		return
	}

	rsp2, err := cli.SignAndExecuteTransactionBlock(ctx, models.SignAndExecuteTransactionBlockRequest{
		TxnMetaData: rsp,
		PriKey:      priKey,
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
