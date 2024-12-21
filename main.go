package main

import (
	"crypto/ed25519"
	"encoding/hex"
	"fmt"

	"github.com/ipoluianov/router/xchg"
)

// PUB: 5ded23a41eb84ec1f95b27d14222155f145a45e76a6377ae9cfcf754a4da9956
// PRIV: a7dee35305a6a7984a0b16900d4adba8eb957c6bb8d71d36ea303f8eaec5d6be5ded23a41eb84ec1f95b27d14222155f145a45e76a6377ae9cfcf754a4da9956
func generateKeys() {
	pubKey, privateKey, err := ed25519.GenerateKey(nil)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(hex.EncodeToString(pubKey))
	fmt.Println(hex.EncodeToString(privateKey))
}

func main() {
	r, err := xchg.GetRouterObject("0x5ded23a41eb84ec1f95b27d14222155f145a45e76a6377ae9cfcf754a4da9956")
	if err != nil {
		fmt.Println(err)
		return
	}
	if len(r.Cheques) < 1 {
		xchg.CreateChequesIDs("0x5ded23a41eb84ec1f95b27d14222155f145a45e76a6377ae9cfcf754a4da9956")

		r, err = xchg.GetRouterObject("0x5ded23a41eb84ec1f95b27d14222155f145a45e76a6377ae9cfcf754a4da9956")
		if err != nil {
			fmt.Println(err)
			return
		}
	}

	xchg.ApplyCheque(r.Cheques[0])
	//fundObj, _ := xchg.GetRouterObject("0xffff12030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f")
	//fmt.Println(fundObj.Digest())

}
