package transactiondata

import "errors"

type RandomnessStateUpdate struct {
}

func (r *RandomnessStateUpdate) Parse(data []byte, offset int) (int, error) {
	return 0, errors.New("not implemented")
}
