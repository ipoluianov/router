module gbtoken::gb {
    use sui::coin::{Self};
    
    public struct GB has drop {
    }
    
    fun init(witness: GB, ctx: &mut TxContext) {
        let (mut treasury, metadata) = coin::create_currency<GB>(witness, 9, b"GB", b"GigaByte", b"GigaByte Token", option::none(), ctx);
        transfer::public_freeze_object(metadata);
        coin::mint_and_transfer<GB>(&mut treasury, 10000000000000000000, tx_context::sender(ctx), ctx);
        transfer::public_transfer<coin::TreasuryCap<GB>>(treasury, tx_context::sender(ctx));
    }
}
