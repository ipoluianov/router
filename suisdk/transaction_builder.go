package suisdk

import (
	"github.com/ipoluianov/router/transactiondata"
)

type TransactionBuilder struct {
	client    *Client
	gasBudget uint64

	commands []*TransactionBuilderMoveCall

	transactionData *transactiondata.TransactionData
}

func NewTransactionBuilder(client *Client) *TransactionBuilder {
	var c TransactionBuilder
	c.client = client
	c.gasBudget = uint64(100000000)
	return &c
}

func (c *TransactionBuilder) AddCommand(cmd *TransactionBuilderMoveCall) {
	c.commands = append(c.commands, cmd)
}

func (c *TransactionBuilder) Build() (string, error) {
	c.transactionData = transactiondata.NewTransactionDataV1()
	senderAddrBS := ParseAddress(c.client.account.Address)
	c.transactionData.V1.Sender = senderAddrBS
	c.transactionData.V1.Expiration = transactiondata.NewTransactionExpiration()

	var gasData transactiondata.GasData
	gasData.Owner = senderAddrBS
	gasData.Price = 750 // TODO: get from chain
	gasData.Budget = c.gasBudget
	// Get GAS coin information
	gasCoinObj, err := c.client.GetGasCoinObj(c.gasBudget)
	if err != nil {
		return "", err
	}
	var payment transactiondata.ObjectRef
	payment.ObjectID.SetHex(gasCoinObj.ObjectId)
	payment.ObjectDigest.SetHex(gasCoinObj.Digest)
	payment.SequenceNumber = transactiondata.SequenceNumber(gasCoinObj.SeqNum)
	gasData.Payment = append(gasData.Payment, payment)
	c.transactionData.V1.GasData = &gasData

	c.transactionData.V1.Kind = &transactiondata.TransactionKind{}
	c.transactionData.V1.Kind.Type = transactiondata.ProgrammableTransactionType
	c.transactionData.V1.Kind.ProgrammableTransaction = &transactiondata.ProgrammableTransaction{}

	for _, cmd := range c.commands {
		cmd.Build(c)
	}

	return "", nil
}
