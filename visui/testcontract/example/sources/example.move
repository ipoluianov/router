module example::example;
use example::fund;

fun init(ctx: &mut TxContext) {
	fund::create_fund(ctx);
}

public fun ex1(_ctx: &mut TxContext) {
}
