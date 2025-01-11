package transactiondata

type IntentScope int

const (
	IntentScopeTransactionData         IntentScope = 0
	IntentScopeTransactionEffects      IntentScope = 1
	IntentScopeCheckpointSummary       IntentScope = 2
	IntentScopePersonalMessage         IntentScope = 3
	IntentScopeSenderSignedTransaction IntentScope = 4
	IntentScopeProofOfPossession       IntentScope = 5
	IntentScopeHeaderDigest            IntentScope = 6
	IntentScopeBridgeEventUnused       IntentScope = 7
	IntentScopeConsensusBlock          IntentScope = 8
	IntentScopeDiscoveryPeers          IntentScope = 9
)

func (c *IntentScope) Parse(data []byte, offset int) (int, error) {
	v, offset, err := ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	*c = IntentScope(v)
	return offset, err
}
