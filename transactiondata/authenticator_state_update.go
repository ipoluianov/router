package transactiondata

import "errors"

type AuthenticatorStateUpdate struct {
}

func (c *AuthenticatorStateUpdate) Parse(data []byte, offset int) (int, error) {
	return 0, errors.New("not implemented")
}
