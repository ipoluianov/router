package suisdk

import (
	"encoding/binary"
	"errors"

	"github.com/ipoluianov/router/transactiondata"
)

type TransactionBuilderMoveCall struct {
	PackageId    string
	ModuleName   string
	FunctionName string
	Arguments    []interface{}
}

type ArgObject string
type ArgU64 uint64

func NewTransactionBuilderMoveCall() *TransactionBuilderMoveCall {
	var c TransactionBuilderMoveCall
	return &c
}

func (c *TransactionBuilderMoveCall) Build(builder *TransactionBuilder) error {
	var cmd transactiondata.Command
	cmd.Type = transactiondata.CommandTypeMoveCall
	cmd.MoveCall = &transactiondata.ProgrammableMoveCall{}
	cmd.MoveCall.Package.SetHex(c.PackageId)
	cmd.MoveCall.Module = c.ModuleName
	cmd.MoveCall.Function = c.FunctionName
	for _, arg := range c.Arguments {
		switch v := arg.(type) {
		case ArgU64:
			value := uint64(v)
			pIndex := c.buildArgumentU64(builder.transactionData.V1.Kind.ProgrammableTransaction, value)
			arg := transactiondata.Argument{}
			arg.ArgumentType = transactiondata.ArgumentTypeInput
			arg.ArgumentInput = transactiondata.ArgumentInput(pIndex)
			cmd.MoveCall.Arguments = append(cmd.MoveCall.Arguments, arg)
		case ArgObject:
			pIndex := c.buildArgumentObject(builder.transactionData.V1.Kind.ProgrammableTransaction, string(v))
			arg := transactiondata.Argument{}
			arg.ArgumentType = transactiondata.ArgumentTypeInput
			arg.ArgumentInput = transactiondata.ArgumentInput(pIndex)
			cmd.MoveCall.Arguments = append(cmd.MoveCall.Arguments, arg)
		default:
			return errors.New("unsupported argument type")
		}
	}

	return nil
}

func (c *TransactionBuilderMoveCall) buildArgumentU64(tx *transactiondata.ProgrammableTransaction, value uint64) int {
	bs := make([]byte, 8)
	binary.LittleEndian.PutUint64(bs, value)
	tx.Inputs = append(tx.Inputs, &transactiondata.CallArg{
		Type: transactiondata.CallArgTypePure,
		Pure: bs,
	})
	return len(tx.Inputs) - 1
}

func (c *TransactionBuilderMoveCall) buildArgumentObject(tx *transactiondata.ProgrammableTransaction, objectId string) int {
	var arg transactiondata.CallArg
	arg.Type = transactiondata.CallArgTypeObject
	var objectArg transactiondata.ObjectArg
	objectArg.Type = transactiondata.ObjectArgTypeSharedObject
	var sharedObj transactiondata.SharedObject
	sharedObj.Id.SetHex(objectId)
	objectArg.SharedObject = &sharedObj
	arg.Object = &objectArg
	tx.Inputs = append(tx.Inputs, &arg)
	return len(tx.Inputs) - 1
}
