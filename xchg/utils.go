package xchg

import (
	"strings"

	"github.com/block-vision/sui-go-sdk/signer"
	"github.com/block-vision/sui-go-sdk/sui"
	"github.com/ipoluianov/router/suisdk"
)

func createClient() (sui.ISuiAPI, *signer.Signer) {
	//var ctx = context.Background()
	var cli = sui.NewSuiClient(suisdk.TESTNET_URL)
	signerAccount, _ := signer.NewSignertWithMnemonic("reveal resist nothing diary romance toe immense then spirit nut problem hawk")
	return cli, signerAccount
}

func getJsonValueByPath(obj map[string]interface{}, path string) interface{} {
	parts := strings.FieldsFunc(path, func(r rune) bool {
		return r == '/'
	})

	//var ok bool

	for index, p := range parts {
		if obj[p] == nil {
			return nil
		}
		nextObj, ok := obj[p].(map[string]interface{})
		if !ok {
			if index == len(parts)-1 {
				return obj[p]
			} else {
				return nil
			}
		} else {
			if index == len(parts)-1 {
				return nextObj
			}
		}

		obj = nextObj
	}
	return nil
}

func GetStringValueByPath(obj map[string]interface{}, path string) string {
	v := getJsonValueByPath(obj, path)
	if v == nil {
		return ""
	}
	return v.(string)
}

func GetNumberValueByPath(obj map[string]interface{}, path string) float64 {
	v := getJsonValueByPath(obj, path)
	if v == nil {
		return 0
	}
	return v.(float64)
}
