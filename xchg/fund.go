package xchg

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/block-vision/sui-go-sdk/models"
)

type FundObject struct {
	AddressesTableId string
	ProfilesTableId  string
	RoutersTableId   string
	NetworkTableId   string
}

func GetFundObject() (*FundObject, error) {
	var c FundObject
	cl, signer := createClient()
	if cl == nil || signer == nil {
		return nil, errors.New("error creating client")
	}

	ctx := context.Background()
	var req models.SuiGetObjectRequest
	req.ObjectId = FUND_OBJECT_ID
	req.Options.ShowBcs = true
	req.Options.ShowType = true
	req.Options.ShowContent = true
	objResp, err := cl.SuiGetObject(ctx, req)
	if err != nil {
		return nil, err
	}

	c.ProfilesTableId = GetStringValueByPath(objResp.Data.Content.Fields, "profiles/fields/id/id")
	c.RoutersTableId = GetStringValueByPath(objResp.Data.Content.Fields, "routers/fields/id/id")
	c.NetworkTableId = GetStringValueByPath(objResp.Data.Content.Fields, "network/fields/id/id")
	c.AddressesTableId = GetStringValueByPath(objResp.Data.Content.Fields, "addresses/fields/id/id")

	return &c, nil
}

func (f *FundObject) Digest() string {
	bs, _ := json.MarshalIndent(f, "", "  ")
	return string(bs)
}
