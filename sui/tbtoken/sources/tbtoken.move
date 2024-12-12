module tbtoken::tb {
    use sui::coin::{Self};
    
    public struct TB has drop {
    }
    
    fun init(witness: TB, ctx: &mut TxContext) {
        let (mut treasury, metadata) = coin::create_currency<TB>(witness, 9, b"TB", b"TeraByte", b"TeraByte Token", option::none(), ctx);
        transfer::public_freeze_object(metadata);
        coin::mint_and_transfer<TB>(&mut treasury, 1000000000000000000, tx_context::sender(ctx), ctx);
        transfer::public_transfer<coin::TreasuryCap<TB>>(treasury, tx_context::sender(ctx));
    }
}
