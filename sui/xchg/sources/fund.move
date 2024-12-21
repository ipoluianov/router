module xchg::fund;
use sui::coin::{Self, Coin};
use sui::balance;
use sui::ed25519;
use sui::address;
use sui::vec_set::{Self, VecSet};
use sui::vec_map::{Self, VecMap};
use sui::table::{Self, Table};
use sui::{clock::Clock};
use std::string::{Self, String};
use sui::event;

const ERR_WRONG_PUBLIC_KEY: u64 = 1;
const ERR_WRONG_MSG: u64 = 2;
const ERR_WRONG_SIGNATURE_LEN: u64 = 3;
//const ERR_WRONG_CHEQUE_ID: u64 = 4;
const ERR_WRONG_COUNT: u64 = 5;
const ERR_MIN_STAKE: u64 = 6;
const ERR_XCHG_ADDR_NOT_FOUND: u64 = 7;
const ERR_XCHG_ROUTER_ADDR_NOT_FOUND: u64 = 8;
//const ERR_XCHG_ROUTER_PROFILE_NOT_FOUND: u64 = 9;
const ERR_XCHG_APP_ADDR_NOT_FOUND: u64 = 10;
//const ERR_XCHG_APP_PROFILE_NOT_FOUND: u64 = 11;
const ERR_XCHG_ROUTER_ALREADY_EXISTS: u64 = 12;

const DIRECTORS_NETWORK: u32 = 0xFFFFFFFF;

public struct LogEvent has copy, drop {
    text: String,
    num: u64,
}

public struct Fund has key, store {
	id: UID,
	counter: u64,
    balance: balance::Balance<tbtoken::tb::TB>,

    commonFund: u64,

    addresses: Table<address, XchgAddress>,
    
    profiles: Table<address, Profile>,
    routers: Table<address, Router>, // by xchg address
    network: Table<u32, Network>,

    directors: vector<RouterInfo>,

    parameters: VecMap<String, String>,

    // proposals
    proposalsToSpend: vector<address>,
    proposalsToChangeParameters: vector<address>,
}

// It is record in the profile
// It is for the convenience of the user
public struct FavoriteXchgAddress has store, drop {
    xchgAddr: address,
    name: String,
    group: String,
    description: String,
}

// Profile is one for each SUI address
// It reflects user profile and his balance
// It can be sponsor for XCHG addresses
// It contains list of favorite XCHG addresses
public struct Profile has store {
    balance: u64,
    own_routers: vector<address>,
    favoriteXchgAddresses: vector<FavoriteXchgAddress>,
    sponsoredXchgAddresses: vector<address>,
}

public struct Sponsor has store, drop {
    limitPerDay: u64,
    virtualBalance : u64,
    lastOperation: u64,
    suiAddr: address,
}

// Separated entity - based on XCHG address
// There is no link to the profile
// Optional: add link to the profile as priority source of funds
public struct XchgAddress has store {

    //____________________________________
    // XCHG address = public key
    xchgAddr: address,
    //////////////////////////////////////

    //____________________________________
    // Funds to spend
    // Priority for spending - SUI addresses of profiles
    sponsors: vector<Sponsor>,
    // If no sponsors - spend this balance
    balance: u64,
    //////////////////////////////////////

    //____________________________________
    // It can be set only once
    // Rewards will be sent to this address
    // It is SUI-address
    ownerSuiAddr: address,
    //////////////////////////////////////

    //____________________________________
    // Statistics
    spentTrafficKb: u256,
    routerWithdrawCount: u256,
    routerWithdrawAmount: u256,
    //////////////////////////////////////
}

// Proposal to spend common fund
public struct ProposalToSpend has key, store {
    id: UID,
    name: String,
    description: String,

    destination: address,
    amount: u64,

    voters: VecSet<address>,
    votes: VecSet<address>,

    closed: bool,
}

// Proposal to change parameters
public struct ProposalToChangeParameters has key, store {
    id: UID,
    name: String,
    description: String,
    
    paramName: String,
    paramValue: String,

    voters: VecSet<address>,
    votes: VecSet<address>,

    closed: bool,
}

public struct Router has store, drop {
    // Segment
    segment: u32,
    // Router's name
    name: String,
    // IP address
    ipAddr: String,
    // SUI Address of the owner
    owner: address,
    // XCHG-Address of the router
    // xchgAddress: address,
    // Nonces 
    chequeIds: VecSet<address>,
    // Stake
    totalStakeAmount: u64,
    // Rewards
    rewards: u64,
}

public struct RouterInfo has store, drop {
    xchgAddress: address,
    ipAddr: String,
    currentStake: u64,
}

public struct Network has store {
    index: u8,
    routers: vector<RouterInfo>
}

public(package) fun create_fund(ctx: &mut TxContext) {
    let mut f = Fund {
        id: object::new(ctx),
        counter: 0,
        balance: balance::zero(),
        commonFund: 0,
        parameters: vec_map::empty(),
        addresses: table::new(ctx),
        profiles: table::new(ctx),
        routers: table::new(ctx),
        network: table::new(ctx),
        directors: vector[],
        proposalsToSpend: vector[],
        proposalsToChangeParameters: vector[],
    };
    let mut networkIndex: u32 = 0;
    while (networkIndex < 4) {
        let network = Network {
            index: networkIndex as u8,
            routers: vector[],
        };
        f.network.add(networkIndex, network);
        networkIndex = networkIndex + 1;
    };

    // Create directors
    let directorsNetwork = Network {
        index: 0,
        routers: vector[],
    };
    f.network.add(DIRECTORS_NETWORK, directorsNetwork);

    transfer::share_object(f);
}

// Create profile and add default account
public fun create_profile(f: &mut Fund, ctx: &mut TxContext) {
    internal_get_profile(f, ctx.sender(), ctx);
}

public fun depositToProfile(f: &mut Fund, payment: Coin<tbtoken::tb::TB>, ctx: &mut TxContext) {
    let value = payment.value();
    coin::put(&mut f.balance, payment);
    let profile = internal_get_profile(f, ctx.sender(), ctx);
    profile.balance = profile.balance + value;
}

// Deposit to the XCHG address
public fun depositToXchgAddr(f: &mut Fund, xchgAddr: address, payment: Coin<tbtoken::tb::TB>, ctx: &mut TxContext) {
    let value = payment.value();
    if (!f.addresses.contains(xchgAddr)) {
        let xchgAddress = XchgAddress {
            xchgAddr: xchgAddr,
            sponsors: vector[],
            balance: value,
            ownerSuiAddr: ctx.sender(),
            spentTrafficKb: 0,
            routerWithdrawCount: 0,
            routerWithdrawAmount: 0,
        };
        f.addresses.add(xchgAddr, xchgAddress);
    } else {
        let xchgAddress = f.addresses.borrow_mut(xchgAddr);
        xchgAddress.balance = xchgAddress.balance + value;
    };
    coin::put(&mut f.balance, payment);
}

// Set owner address only if it is not set or current owner is the same as the sender
public fun setOwnerSuiAddr(f: &mut Fund, xchgAddr: address, suiAddr: address, ctx: &mut TxContext) {
    assert!(f.addresses.contains(xchgAddr), ERR_XCHG_ADDR_NOT_FOUND);

    let xchgAddress = f.addresses.borrow_mut(xchgAddr);
    if (xchgAddress.ownerSuiAddr == @0x0 || xchgAddress.ownerSuiAddr == ctx.sender()) {
        xchgAddress.ownerSuiAddr = suiAddr;
    };
}

public fun addFavoriteXchgAddress(f: &mut Fund, xchgAddr: address, name: String, group: String, description: String, ctx: &mut TxContext) {
    let profile = internal_get_profile(f, ctx.sender(), ctx);

    let mut i = 0;
    while (i < profile.favoriteXchgAddresses.length()) {
        if (profile.favoriteXchgAddresses[i].xchgAddr == xchgAddr) {
            assert!(false, ERR_XCHG_ADDR_NOT_FOUND);
        };
        i = i + 1;
    };

    let favoriteXchgAddress = FavoriteXchgAddress {
        xchgAddr: xchgAddr,
        name: name,
        group: group,
        description: description,
    };
    profile.favoriteXchgAddresses.push_back(favoriteXchgAddress);
}

public fun removeFavoriteXchgAddress(f: &mut Fund, xchgAddr: address, ctx: &mut TxContext) {
    assert!(f.profiles.contains(ctx.sender()), ERR_XCHG_APP_ADDR_NOT_FOUND);
    let profile = f.profiles.borrow_mut(ctx.sender());
    let mut i = 0;
    while (i < profile.favoriteXchgAddresses.length()) {
        if (profile.favoriteXchgAddresses[i].xchgAddr == xchgAddr) {
            profile.favoriteXchgAddresses.remove(i);
            break
        };
        i = i + 1;
    };
}

public fun becomeSponsor(f: &mut Fund, xchgAddr: address, ctx: &mut TxContext) {
    assert!(f.profiles.contains(ctx.sender()), ERR_XCHG_APP_ADDR_NOT_FOUND);
    let profile = f.profiles.borrow_mut(ctx.sender());
    assert!(f.addresses.contains(xchgAddr), ERR_XCHG_ADDR_NOT_FOUND);
    assert!(!profile.sponsoredXchgAddresses.contains(&xchgAddr), ERR_XCHG_ADDR_NOT_FOUND);
    let addr = f.addresses.borrow_mut(xchgAddr);
    let sponsor = Sponsor {
        limitPerDay: 1000,
        virtualBalance: 1000,
        lastOperation: 0,
        suiAddr: ctx.sender(),
    };
    addr.sponsors.push_back(sponsor);
}

public fun stopSponsor(f: &mut Fund, xchgAddr: address, ctx: &mut TxContext) {
    assert!(f.profiles.contains(ctx.sender()), ERR_XCHG_APP_ADDR_NOT_FOUND);
    let profile = f.profiles.borrow_mut(ctx.sender());
    assert!(f.addresses.contains(xchgAddr), ERR_XCHG_ADDR_NOT_FOUND);
    assert!(profile.sponsoredXchgAddresses.contains(&xchgAddr), ERR_XCHG_ADDR_NOT_FOUND);
    let addr = f.addresses.borrow_mut(xchgAddr);
    let mut i = 0;
    while (i < addr.sponsors.length()) {
        if (addr.sponsors[i].suiAddr == ctx.sender()) {
            addr.sponsors.remove(i);
            break
        };
        i = i + 1;
    };
    i = 0;
    while (i < profile.sponsoredXchgAddresses.length()) {
        if (profile.sponsoredXchgAddresses[i] == xchgAddr) {
            profile.sponsoredXchgAddresses.remove(i);
            break
        };
        i = i + 1;
    };
}

public fun modifyFavoriteXchgAddress(f: &mut Fund, xchgAddr: address, name: String, group: String, description: String, ctx: &mut TxContext) {
    assert!(f.profiles.contains(ctx.sender()), ERR_XCHG_APP_ADDR_NOT_FOUND);
    let profile = f.profiles.borrow_mut(ctx.sender());
    let mut i = 0;
    while (i < profile.favoriteXchgAddresses.length()) {
        if (profile.favoriteXchgAddresses[i].xchgAddr == xchgAddr) {
            profile.favoriteXchgAddresses[i].name = name;
            profile.favoriteXchgAddresses[i].group = group;
            profile.favoriteXchgAddresses[i].description = description;
            break
        };
        i = i + 1;
    };
}

public fun createRouter(f: &mut Fund, segment: u32, name: String, ipAddr: String, routerXchgAddr: address, ctx: &mut TxContext) {
    let profile = internal_get_profile(f, ctx.sender(), ctx);
    profile.own_routers.push_back(routerXchgAddr);
    assert!(!f.routers.contains(routerXchgAddr), ERR_XCHG_ROUTER_ALREADY_EXISTS);
    let router = Router {
        segment: segment,
        name: name,
        ipAddr: ipAddr,
        owner: ctx.sender(),
        chequeIds: vec_set::empty(),
        totalStakeAmount: 0,
        rewards: 0,
    };
    f.routers.add(routerXchgAddr, router);
    internal_place_router_to_directors(f, routerXchgAddr, ctx);
    internal_place_router_to_network(f, routerXchgAddr, ctx);
}

public fun removeRouter(f: &mut Fund, routerXchgAddr: address, ctx: &mut TxContext) {
    // Modify routers
    assert!(f.routers.contains(routerXchgAddr), ERR_XCHG_ROUTER_ADDR_NOT_FOUND);
    let router = f.routers.borrow(routerXchgAddr);
    assert!(router.owner == ctx.sender(), ERR_XCHG_ROUTER_ADDR_NOT_FOUND);
    let routerAmount = router.totalStakeAmount;
    let routerRewards = router.rewards;

    // Modify profile
    let profile = internal_get_profile(f, ctx.sender(), ctx);
    let mut i = 0;
    while (i < profile.own_routers.length()) {
        if (profile.own_routers[i] == routerXchgAddr) {
            profile.own_routers.remove(i);
            break
        };
        i = i + 1;
    };

    profile.balance = profile.balance + routerAmount + routerRewards;

    internal_remove_router_from_network(f, routerXchgAddr, ctx);
}

#[allow(lint(self_transfer))]
public fun withdrawFromProfile(f: &mut Fund, amount: u64, ctx: &mut TxContext) {
    let profile = internal_get_profile(f, ctx.sender(), ctx);
    assert!(profile.balance >= amount, ERR_MIN_STAKE);
    profile.balance = profile.balance - amount;
    let coin = coin::take(&mut f.balance, amount, ctx);
    transfer::public_transfer(coin, ctx.sender())
}

// MSG:104 = [CHEQUE_ID:32, ROUTER_XCHG_ADDR:32, APPLICATION_XCHG_ADDR:32, AMOUNT:8]
public fun apply_cheque(f: &mut Fund, pk: vector<u8>,  msg: vector<u8>, sig: vector<u8>, clock: &Clock, ctx: &mut TxContext) {
    assert!(pk.length() == 32, ERR_WRONG_PUBLIC_KEY);
    assert!(msg.length() == 104, ERR_WRONG_MSG);
    assert!(sig.length() == 64, ERR_WRONG_SIGNATURE_LEN);

    if (ed25519::ed25519_verify(&sig, &pk, &msg)) {
        let mut vChequeId: vector<u8> = vector[];
        let mut vRouterAddr: vector<u8> = vector[];
        let mut vAppAddress: vector<u8> = vector[];
        let mut amount: u64 = 0;
        let mut i = 0;
        let mut offset: u64 = 0;

        // Parse Cheque ID
        while (i < 32) {
            vChequeId.push_back(msg[i]);
            i = i + 1;
        };
        offset = offset + 32;

        // Parse Router Address
        i = 0;
        while (i < 32) {
            vRouterAddr.push_back(msg[offset+i]);
            i = i + 1;
        };
        offset = offset + 32;

        // Parse Application Address
        i = 0;
        while (i < 32) {
            vAppAddress.push_back(msg[offset+i]);
            i = i + 1;
        };
        offset = offset + 32;

        i = 0;
        // Parse Amount
        while (i < 8) {
            amount = amount << 8;
            let localOffset = offset + 8 - i - 1;
            amount = amount + (msg[localOffset] as u64);
            i = i + 1;
        };

        // Parse Amount Little Endian
        event::emit(LogEvent{ text: string::utf8(b"Parsed amount"), num: amount});

        event::emit(LogEvent{ text: string::utf8(b"Parsed amount 1"), num: msg[96] as u64});
        event::emit(LogEvent{ text: string::utf8(b"Parsed amount 2"), num: msg[97] as u64});


        // Check cheque ID
        let checkIdAsAddr = address::from_bytes(vChequeId);
        let routerAddr = address::from_bytes(vRouterAddr);
        if (!f.routers.contains(routerAddr)) {
            event::emit(LogEvent{ text: string::utf8(b"Router not found"), num: 0});
            // Router not found - just skip it
            return
        };

        let router = f.routers.borrow_mut(routerAddr);
        if (!router.chequeIds.contains(&checkIdAsAddr)) {
            event::emit(LogEvent{ text: string::utf8(b"Cheque ID not found"), num: 0});
            // Cheque ID not found - just skip it
            // It may by replay attack
            return
        };

        // find client account
        let clientAddr = address::from_bytes(pk);
        if (!f.addresses.contains(clientAddr)) {
            event::emit(LogEvent{ text: string::utf8(b"Client not found"), num: 0});
            // No source of funds - nothing to do
            return
        };

        event::emit(LogEvent{ text: string::utf8(b"Cheque applied"), num: amount});

        // Cheque cancellation
        router.chequeIds.remove(&checkIdAsAddr);

        // Calculate amounts
        let amountOnePercent = amount / 100;
        let amountToRouter = amountOnePercent * 70;
        let amountToDeveloper = amountOnePercent * 20;
        let mut amountToFund = amount;

        event::emit(LogEvent{ text: string::utf8(b"Cheque applied"), num: amountOnePercent});
        event::emit(LogEvent{ text: string::utf8(b"to router"), num: amountToRouter});
        event::emit(LogEvent{ text: string::utf8(b"to dev"), num: amountToDeveloper});

        let xchgClient = f.addresses.borrow_mut(clientAddr);
        
        // get money from sponsors
        let mut i = 0;
        while (i < xchgClient.sponsors.length()) {
            // Prepare data
            let sponsorAddr = xchgClient.sponsors[i].suiAddr;
            let sponsorProfile = f.profiles.borrow_mut(sponsorAddr);
            let mut sponsorVirtualBalance = xchgClient.sponsors[i].virtualBalance;
            let currentTime = clock.timestamp_ms();
            let lastOperation = xchgClient.sponsors[i].lastOperation;
            let limitPerDay = xchgClient.sponsors[i].limitPerDay;

            // Calc new virtual balance of sponsor 
            let balanceToAdd = (currentTime - lastOperation)  * limitPerDay / 86400000;
            sponsorVirtualBalance = sponsorVirtualBalance + balanceToAdd;
            if (sponsorVirtualBalance > limitPerDay) {
                sponsorVirtualBalance = limitPerDay;
            };

            if (sponsorVirtualBalance >= amount) {
                xchgClient.sponsors[i].virtualBalance = sponsorVirtualBalance - amount;
                sponsorProfile.balance = sponsorProfile.balance - amount;
                xchgClient.balance = xchgClient.balance + amount;
                event::emit(LogEvent{ text: string::utf8(b"get from sponsor"), num: xchgClient.balance});
                break
            };
            i = i + 1;
        };

        // Try to transfer funds to the router owner
        let routerSUIAddress = router.owner;
        if (f.profiles.contains(routerSUIAddress)) {
            let xchgAddress = f.addresses.borrow_mut(clientAddr);
            let routerProfile = f.profiles.borrow_mut(routerSUIAddress);
            if (xchgAddress.balance >= amountToRouter) {
                xchgAddress.balance = xchgAddress.balance - amountToRouter;
                routerProfile.balance = routerProfile.balance + amountToRouter;
                amountToFund = amountToFund - amountToRouter;
                event::emit(LogEvent{ text: string::utf8(b"transfered to router"), num: amountToRouter});

            } else {
                routerProfile.balance = routerProfile.balance + xchgAddress.balance;
                amountToFund = amountToFund - xchgAddress.balance;
                event::emit(LogEvent{ text: string::utf8(b"transfered to router all in"), num: xchgAddress.balance});
                xchgAddress.balance = 0;
            };
        };

        // Try to transfer funds to the developer
        let appAddr = address::from_bytes(vAppAddress);
        if (f.profiles.contains(appAddr)) {
            let appProfile = f.profiles.borrow_mut(appAddr);
            let xchgAddress = f.addresses.borrow_mut(clientAddr);
            if (xchgAddress.balance >= amountToDeveloper) {
                xchgAddress.balance = xchgAddress.balance - amountToDeveloper;
                appProfile.balance = appProfile.balance + amountToDeveloper;
                amountToFund = amountToFund - amountToDeveloper;
                event::emit(LogEvent{ text: string::utf8(b"transfered to dev"), num: amountToDeveloper});
            } else {
                appProfile.balance = appProfile.balance + xchgAddress.balance;
                amountToFund = amountToFund - xchgAddress.balance;
                event::emit(LogEvent{ text: string::utf8(b"transfered to dev all in "), num: xchgAddress.balance});
                xchgAddress.balance = 0;
            }
        };

        event::emit(LogEvent{ text: string::utf8(b"transfered to common fund"), num: amountToFund});
        f.commonFund = f.commonFund + amountToFund;

        f.counter = f.counter + 1;
    };
}

public fun get_cheques_ids(f: &mut Fund, xchgAddressOfRouter: address, count: u32, clock: &Clock, _ctx: &mut TxContext) : vector<address> {
    assert!(count > 0 && count < 100, ERR_WRONG_COUNT);
    let mut i: u256 = 0;
    let router = f.routers.borrow_mut(xchgAddressOfRouter);
    let timeStampNs = (clock.timestamp_ms() * 1000) as u256;
    let mut vecResult: vector<address> = vector[];
    while (i < (count as u256)) {
        let rndAddr = address::from_u256(timeStampNs + i);
        router.chequeIds.insert(rndAddr);
        i = i + 1;
        vecResult.push_back(rndAddr);
    };
    return vecResult
}

// Router profile can stake from deposit to router
public fun addStake(f: &mut Fund, routerXchgAddr: address, stake: u64, ctx: &mut TxContext) {
    assert!(f.profiles.contains(ctx.sender()), ERR_XCHG_ROUTER_ADDR_NOT_FOUND);
    let profile = f.profiles.borrow_mut(ctx.sender());
    assert!(f.routers.contains(routerXchgAddr), ERR_XCHG_ROUTER_ADDR_NOT_FOUND);
    let router = f.routers.borrow_mut(routerXchgAddr);
    assert!(profile.balance >= stake, ERR_MIN_STAKE);

    router.totalStakeAmount = router.totalStakeAmount + stake;
    profile.balance = profile.balance - stake;

    internal_place_router_to_directors(f, routerXchgAddr, ctx);
    internal_place_router_to_network(f, routerXchgAddr, ctx)
}

public fun removeStake(f: &mut Fund, routerXchgAddr: address, stake: u64, ctx: &mut TxContext) {
    assert!(f.profiles.contains(ctx.sender()), ERR_XCHG_ROUTER_ADDR_NOT_FOUND);
    let profile = f.profiles.borrow_mut(ctx.sender());
    assert!(f.routers.contains(routerXchgAddr), ERR_XCHG_ROUTER_ADDR_NOT_FOUND);
    let router = f.routers.borrow_mut(routerXchgAddr);
    assert!(router.totalStakeAmount >= stake, ERR_MIN_STAKE);

    router.totalStakeAmount = router.totalStakeAmount - stake;
    profile.balance = profile.balance + stake;


    internal_place_router_to_directors(f, routerXchgAddr, ctx);
    internal_place_router_to_network(f,routerXchgAddr, ctx);
}

public fun create_proposal_to_spend(f: &mut Fund, name: String, description: String, destination: address, ctx: &mut TxContext) {
    let mut proposal = ProposalToSpend {
        id: object::new(ctx),
        name: name,
        amount: 0,
        description: description,
        destination: destination,
        voters: vec_set::empty(),
        votes: vec_set::empty(),
        closed: false,
    };

    let mut i = 0;
    while (i < f.directors.length()) {
        let routerInfo = f.directors.borrow(i);
        proposal.voters.insert(routerInfo.xchgAddress);
        i = i + 1;
    };

    let addr = proposal.id.to_address();
    transfer::share_object(proposal);
    f.proposalsToSpend.insert(addr, 0);

    if (f.proposalsToSpend.length() > 10) {
        f.proposalsToSpend.pop_back();
    };
}

public fun vote_for_proposal_to_spend(f: &mut Fund, proposal: &mut ProposalToSpend, ctx: &mut TxContext) {
    assert!(proposal.closed == false, ERR_WRONG_MSG);
    let profile = internal_get_profile(f, ctx.sender(), ctx);
    let mut i = 0;
    while (i < profile.own_routers.length()) {
        let routerXchgAddr = profile.own_routers[i];
        if (proposal.voters.contains(&routerXchgAddr)) {
            proposal.votes.insert(routerXchgAddr);
        };
        i = i + 1;
    };

    let needVotes = proposal.voters.size() / 2;

    let propAmount = proposal.amount;

    if (proposal.votes.size() > needVotes) {
        f.commonFund = f.commonFund - propAmount;
        let destProfile = internal_get_profile(f, proposal.destination, ctx);
        destProfile.balance = destProfile.balance + propAmount;
    };

    proposal.closed = true;
}

public fun create_proposal_to_change_parameters(f: &mut Fund, paramName: String, paramValue: String, ctx: &mut TxContext) {
    let mut proposal = ProposalToChangeParameters {
        id: object::new(ctx),
        name: paramName,
        paramName: paramName,
        paramValue: paramValue,
        description: std::string::utf8(b""),
        voters: vec_set::empty(),
        votes: vec_set::empty(),
        closed: false,
    };

    let mut i = 0;
    while (i < f.directors.length()) {
        let routerInfo = f.directors.borrow(i);
        proposal.voters.insert(routerInfo.xchgAddress);
        i = i + 1;
    };

    let addr = proposal.id.to_address();
    transfer::share_object(proposal);
    f.proposalsToChangeParameters.insert(addr, 0);

    if (f.proposalsToChangeParameters.length() > 10) {
        f.proposalsToChangeParameters.pop_back();
    };
}

public fun vote_for_proposal_to_change_parameters(f: &mut Fund, proposal: &mut ProposalToChangeParameters, ctx: &mut TxContext) {
    assert!(proposal.closed == false, ERR_WRONG_MSG);
    let profile = internal_get_profile(f, ctx.sender(), ctx);
    let mut i = 0;
    while (i < profile.own_routers.length()) {
        let routerXchgAddr = profile.own_routers[i];
        if (proposal.voters.contains(&routerXchgAddr)) {
            proposal.votes.insert(routerXchgAddr);
        };
        i = i + 1;
    };

    let needVotes = proposal.voters.size() / 2;

    if (proposal.votes.size() > needVotes) {
        if (f.parameters.contains(&proposal.paramName)) {
            f.parameters.remove(&proposal.paramName);
        };
        f.parameters.insert(proposal.paramName, proposal.paramValue);
    };

    proposal.closed = true;
}

fun internal_place_router_to_network(f: &mut Fund, routerAddress: address, _ctx: &mut TxContext) {
    let router = f.routers.borrow_mut(routerAddress);
    let network = f.network.borrow_mut(router.segment);
    let mut i = 0;

    let mut indexToInsert = network.routers.length();

    // Remove previous record
    while (i < network.routers.length()) {
        let routerInfo = network.routers.borrow(i);
        if (routerInfo.xchgAddress == routerAddress) {
            network.routers.remove(i);
            break
        };
        i = i + 1;
    };

    if (network.routers.length() > 0) {
        // Find place to insert
        i = 0;
        while (i < network.routers.length()) {
            let routerInfo = network.routers.borrow(i);
            if (router.totalStakeAmount > routerInfo.currentStake) {
                indexToInsert = i;
                break
            };
            i = i + 1;
        };
    } else {
        indexToInsert = 0;
    };

    if (indexToInsert < network.routers.length()) {
        network.routers.insert( RouterInfo{
            xchgAddress: routerAddress,
            ipAddr: router.ipAddr,
            currentStake: router.totalStakeAmount,
        }, indexToInsert);
        if (network.routers.length() > 10) {
            network.routers.pop_back();
        };
    };
}

fun internal_remove_router_from_network(f: &mut Fund, routerXchgAddress: address, _ctx: &mut TxContext) {
    let router = f.routers.borrow(routerXchgAddress);
    let network = f.network.borrow_mut(router.segment);
    let mut i = 0;

    while (i < network.routers.length()) {
        let routerInfo = network.routers.borrow(i);
        if (routerInfo.xchgAddress == routerXchgAddress) {
            network.routers.remove(i);
            break
        };
        i = i + 1;
    };

    i = 0;
    while (i < f.directors.length()) {
        let routerInfo = f.directors.borrow(i);
        if (routerInfo.xchgAddress == routerXchgAddress) {
            f.directors.remove(i);
            break
        };
        i = i + 1;
    };
}

fun internal_place_router_to_directors(f: &mut Fund, routerAddress: address, _ctx: &mut TxContext) {
    let router = f.routers.borrow_mut(routerAddress);
    let network = &mut f.directors;
    let mut i = 0;

    let mut indexToInsert = network.length();

    // Remove previous record
    while (i < network.length()) {
        let routerInfo = network.borrow(i);
        if (routerInfo.xchgAddress == routerAddress) {
            network.remove(i);
            break
        };
        i = i + 1;
    };

    if (network.length() > 0) {
        // Find place to insert
        i = 0;
        while (i < network.length()) {
            let routerInfo = network.borrow(i);
            if (router.totalStakeAmount > routerInfo.currentStake) {
                indexToInsert = i;
                break
            };
            i = i + 1;
        };
    } else {
        indexToInsert = 0;
    };

    if (indexToInsert < network.length()) {
        network.insert( RouterInfo{
            xchgAddress: routerAddress,
            ipAddr: router.ipAddr,
            currentStake: router.totalStakeAmount,
        }, indexToInsert);
        if (network.length() > 10) {
            network.pop_back();
        };
    };
}

fun internal_get_profile(f: &mut Fund, address: address, _ctx: &mut TxContext) : &mut Profile {
    if (!f.profiles.contains(address)) {
        let profile = Profile {
            balance: 0,
            favoriteXchgAddresses: vector[],
            own_routers: vector[],
            sponsoredXchgAddresses: vector[],
        };
        f.profiles.add(address, profile);
        return f.profiles.borrow_mut(address)
    };
    return f.profiles.borrow_mut(address)
}
