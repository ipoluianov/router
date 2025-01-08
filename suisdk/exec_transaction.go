package suisdk

/*
func (c *Client) MoveCallPrepare(packageId string, moduleName string, functionName string) (*TransactionBlockBytes, error) {
	signerAccount, _ := signer.NewSignertWithMnemonic("reveal resist nothing diary romance toe immense then spirit nut problem hawk")
	gasObj := "0x8063aea9684219ac3e72198e6c7b0d86b25c745959c075f7cde6ff8dc43f3cd7"
	requestBody := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "unsafe_moveCall",
		Params: []interface{}{
			signerAccount.Address,
			packageId,
			moduleName,
			functionName,
			[]interface{}{},
			[]interface{}{},
			&gasObj,
			"100000000",
		},
	}

	res, err := c.rpcCall(requestBody)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	if res.Error != nil {
		fmt.Println("ERROR")
		fmt.Println(res.Error.Code, res.Error.Message)
		return nil, fmt.Errorf("ERROR: %d %s", res.Error.Code, res.Error.Message)
	}

	var txBytes TransactionBlockBytes

	json.Unmarshal(res.Result, &txBytes)

	fmt.Println(string(res.Result))
	fmt.Println(txBytes.TxBytes)
	return &txBytes, nil
}

type SigFlag byte

const (
	SigFlagEd25519   SigFlag = 0x00
	SigFlagSecp256k1 SigFlag = 0x01
)

func ToSerializedSignature(signature, pubKey []byte) string {
	signatureLen := len(signature)
	pubKeyLen := len(pubKey)
	serializedSignature := make([]byte, 1+signatureLen+pubKeyLen)
	serializedSignature[0] = byte(SigFlagEd25519)
	copy(serializedSignature[1:], signature)
	copy(serializedSignature[1+signatureLen:], pubKey)
	return base64.StdEncoding.EncodeToString(serializedSignature)
}

var IntentBytes = []byte{0, 0, 0}

func messageWithIntent(message []byte) []byte {
	intent := IntentBytes
	intentMessage := make([]byte, len(intent)+len(message))
	copy(intentMessage, intent)
	copy(intentMessage[len(intent):], message)
	return intentMessage
}

func SignSerializedSigWith(txBytesStr string) *models.SignedTransactionSerializedSig {
	signerAccount, _ := signer.NewSignertWithMnemonic("reveal resist nothing diary romance toe immense then spirit nut problem hawk")
	privateKey := signerAccount.PriKey
	txBytes, _ := base64.StdEncoding.DecodeString(txBytesStr)
	message := messageWithIntent(txBytes)
	digest := blake2b.Sum256(message)
	var noHash crypto.Hash
	sigBytes, err := privateKey.Sign(nil, digest[:], noHash)
	if err != nil {
		log.Fatal(err)
	}
	return &models.SignedTransactionSerializedSig{
		TxBytes:   txBytesStr,
		Signature: ToSerializedSignature(sigBytes, privateKey.Public().(ed25519.PublicKey)),
	}
}

func (c *Client) MoveCallSignature(txBytes string) *models.SignedTransactionSerializedSig {
	signerAccount, _ := signer.NewSignertWithMnemonic("reveal resist nothing diary romance toe immense then spirit nut problem hawk")
	sigResult, _ := signerAccount.SignTransaction(txBytes)
	return sigResult
}

func (c *Client) MoveCallExecute(txBytes string, signature string) {
	fmt.Println("")
	fmt.Println("SUI EXECUTING TRANSACTION BLOCK")
	fmt.Println("")
	requestBody := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "sui_executeTransactionBlock",
		Params: []interface{}{
			txBytes,
			[]string{signature},
		},
	}

	res, err := c.rpcCall(requestBody)
	if err != nil {
		fmt.Println(err)
		return
	}

	if res.Error != nil {
		fmt.Println("ERROR")
		fmt.Println(res.Error.Code, res.Error.Message)
		return
	}

	fmt.Println(string(res.Result))
}

func (c *Client) ExecTransaction() {
	txSigned := "AQAAAAAAAAEAGmXIAXaFMG3ViHLhWjHiu+9B6t+i1GkX4mzdXH/mP24Gc2ltcGxlBmNyZWF0ZQAAJHiUmN7rS4THPlhVSnORKixqI1iQWQOsaPmnKBjGR2YBa3+oNdGrNt7nFV0CfNrdY6cBAZ8WFKwuqjflpdQyxvCLVs8YAAAAACCEF52nJlsF+blRcz4LTkX2/ju3O3QGMvfI5JxNwOyxJiR4lJje60uExz5YVUpzkSosaiNYkFkDrGj5pygYxkdm7gIAAAAAAADA9iUAAAAAAAABYQDTpDMTsh6UOyqT5l96yeCQD0U/hzZ147qxrRpwVc+k+iqW0VX6jiiXo9fllDXlVrPQsP0+otJiIU7gn0nLwicCSsvwf9FpM+PkxqR4M/ZZ6AckAw1ZXUg619op3A0y61w="

	txSignedBin, _ := base64.StdEncoding.DecodeString(txSigned)
	msgBS := txSignedBin[4 : len(txSignedBin)-97-2]
	sigBS := txSignedBin[len(txSignedBin)-97:]
	txSignedHex := hex.EncodeToString(msgBS)
	fmt.Println("SIG HEX:", txSignedHex, len(msgBS))

	base64Signature := base64.StdEncoding.EncodeToString(sigBS)
	base64Msg := base64.StdEncoding.EncodeToString(msgBS)

	var showParams TransactionBlockResponseOptions
	showParams.ShowInput = true
	showParams.ShowRawInput = true
	showParams.ShowEffects = true
	showParams.ShowEvents = true
	showParams.ShowObjectChanges = true
	showParams.ShowBalanceChanges = true
	showParams.ShowRawEffects = false

	requestBody := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "sui_executeTransactionBlock",
		Params: []interface{}{
			base64Msg,
			[]string{base64Signature},
			showParams,
			"WaitForLocalExecution",
		},
	}

	res, err := c.rpcCall(requestBody)
	if err != nil {
		fmt.Println(err)
		return
	}

	if res.Error != nil {
		fmt.Println("ERROR")
		fmt.Println(res.Error.Code, res.Error.Message)
		return
	}

	fmt.Println("OK")
	fmt.Println(string(res.Result))
}
*/
