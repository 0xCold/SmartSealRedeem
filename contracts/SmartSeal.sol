//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

struct Seal {
    address authority;
    bool redeemed;
    string uri;
}

enum PermissionLevel { 
    USER,
    ADMIN, 
    OWNER 
}

/* 
*  @dev Wraps a message with the Ethereum identifier.
*
*  @param hash: The message to wrap.
*/
function prefixed(bytes32 hash) 
    pure 
    returns (bytes32) 
{
    return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
}

/* 
*  @dev Splits a signature into its separate parts.
*
*  @param sig: The signature to split.
*/
function splitSignature(bytes memory sig)
    pure
    returns (uint8, bytes32, bytes32)
{
    require(sig.length == 65);
    bytes32 r;
    bytes32 s;
    uint8 v;
    assembly {
        r := mload(add(sig, 32))
        s := mload(add(sig, 64))
        v := byte(0, mload(add(sig, 96)))
    }
    return (v, r, s);
}

/* 
*  @dev: Recovers the public key of the signer of a message.
*
*  @param messsage: An unsigned reconstruction of the message.
*
*  @param sig: The signed message to extract from.
*/
function recoverSigner(bytes32 message, bytes memory sig) 
    pure
    returns (address)
{
    uint8 v;
    bytes32 r;
    bytes32 s;
    (v, r, s) = splitSignature(sig);
    return ecrecover(message, v, r, s);
}

/* 
*  @dev: Helper function to convert between items from the PermissionLevel enum and uints.
*
*  @param pl: A PermissionLevel enum object to derive an integer from.
*/
function readPermissionLevel(PermissionLevel pl) 
    pure 
    returns (uint) 
{
    return uint(pl) - 1;
}

contract SmartSeal is ERC721URIStorage, ERC721Enumerable {

    // Can track these events to monitor actions by contract admins and detect malicious activity.
    event PermissionsUpdated(address indexed _user, uint indexed _to, address indexed _by);
    event PausedStatusChanged(bool indexed _to, address indexed _by);

    // Can track these events to monitor the creation and redemption of SmartSeal NFTs to display on a front end app.
    event SealCreated(Seal indexed _seal, address indexed _by);
    event SealRedeemed(Seal indexed _seal, address indexed _by);

    // Whether or not the contract is currently paused.
    bool public _paused = false;

    // Mapping from an address to that user's permission level.
    mapping(address => uint) public _permissions;

    // Number of Seals created by contract admins.
    uint public _sealIds = 0;

    // Mapping from a Seal ID to the struct containing information about it.
    mapping(uint => Seal) public _sealInfos;

    // Mapping from a SmartSeal custodial wallet address to the ID of the Seal it can redeem.
    mapping(address => uint) public _sealAuthorities;

    /* 
    *  @dev Initializes the contract and sets the ERC721 token metadata.
    */
    constructor() 
        ERC721("SmartSeal", "SMT") 
    {
        // Registers deployer as the owner
        _permissions[msg.sender] = readPermissionLevel(PermissionLevel.OWNER);
    }

    /*
    *  @dev Asserts that a function caller has a permission level equal to or greater than a given level.
    */
    modifier hasPermission(PermissionLevel pl) {
        uint level = readPermissionLevel(pl);
        require(_permissions[msg.sender] >= level);
        _;
    }

    /*
    *  @dev Asserts that the contract is not paused at the time of a function call. If the function 
    *  caller has a permission level of Admin or greater then any pause is ignored and the assertion passes.
    */
    modifier notPaused 
    {
        require((_permissions[msg.sender] >= readPermissionLevel(PermissionLevel.ADMIN)) || !_paused);
        _;
    }

    /* 
    *  @dev Allows the owner to update a provided user's privileges to a provided value. If the new permission level
    *  is Owner it will also revert the caller's permission level to User, effectively transferring contract ownership.
    *  Note that other permission levels will remain unchanged, and if the new user wants to demote/promote additional
    *  users they must do so in subsequent transactions.
    *
    *  @param user:
    *
    *  @param level:
    */
    function updatePermissions(address user, uint level)
        public
        hasPermission(PermissionLevel.ADMIN)
    {
        // Revert if the caller is trying to alter the permissions of a higher-permissioned user
        require(_permissions[msg.sender] > _permissions[user]);

        // If the caller is not the owner, revert if they are trying to grant a permission level higher than their own.
        if (_permissions[msg.sender] != readPermissionLevel(PermissionLevel.OWNER)) {
            require(_permissions[msg.sender] > level);
        }

        // If the caller is the owner and transferring their ownership, revoke theirs first.
        else if (level == readPermissionLevel(PermissionLevel.OWNER)) {
            _permissions[msg.sender] = readPermissionLevel(PermissionLevel.USER);
        }

        // Grant the permission level.
        _permissions[user] = level;
        emit PermissionsUpdated(user, level, msg.sender);
    }

    /* 
    *  @dev Allows users with admin permissions or greater to flip the paused variable.
    */
    function pauseContract()
        public
        hasPermission(PermissionLevel.ADMIN)
    {
        _paused = !_paused;
        emit PausedStatusChanged(_paused, msg.sender);
    }

    /* 
    *  @dev Allows an admin to add a new SmartSeal NFT, redeemable by a provided account. Also takes in 
    *  a string which, when appended to the baseUri, should point to the Seal's NFT metadata.
    *
    *  @param authority: The address of the account which must be present as a signer for the Seal to be redeemed.
    *
    *  @param uri: A string which should link to the Seal NFT's metadata, in JSON format.
    */
    function createSeal(address authority, string memory uri)
        public
        hasPermission(PermissionLevel.ADMIN)
    {
        require(_sealAuthorities[authority] == 0);

        _sealIds = _sealIds + 1;
        uint id = _sealIds;

        _sealAuthorities[authority] = id;

        Seal memory sealInfo = Seal({
            authority: authority, 
            redeemed: false,
            uri: uri
        });

        _sealInfos[id] = sealInfo;

        emit SealCreated(sealInfo, msg.sender);
    }

    /* 
    *  @dev Allows a user to redeem a created SmartSeal NFT, provided that the NFT has not yet been
    *  redeemed and the corresponding authority has signed the transaction. If the contract is paused,
    *  only users with admin permissions can call this function.
    *
    *  @param id:
    *
    *  @param sig:
    */
    function redeemSeal(uint id, bytes memory sig)
        public
        notPaused
    {
        require(!_sealInfos[id].redeemed);

        // Reconstruct the message and use it to extract the signer from the provided message. 
        bytes32 message = prefixed(keccak256(abi.encodePacked(id, msg.sender)));
        address signer = recoverSigner(message, sig);

        // Revert if the signer is not the Seal authority.
        require(_sealInfos[id].authority == signer);

        _sealInfos[id].redeemed = true;

        _safeMint(msg.sender, id);
        _setTokenURI(id, _sealInfos[id].uri);

        emit SealRedeemed(_sealInfos[id], msg.sender);
    }

    /* 
    *  @dev Returns the number of Seals which have been created by the admin.
    *
    *  Note that this is not necessarily equal to the token total supply, as 
    *  tokens aren't minted until the Seal is redeemed.
    */
    function totalSealSupply() 
        public 
        view 
        returns (uint) 
    {
        return _sealIds;
    }

    /* 
    *  @dev Returns the ID mapped to the provided authority. Note that this call will never fail, but rather
    *  will return an ID of 0. Token IDs must be at least 1, so if we see this we know the address has not been 
    *  used an an authority yet.
    *
    *  @param authority: The address of the authority account to index.
    */
    function authorityToId(address authority) 
        public 
        view 
        returns (uint) 
    {
        return _sealAuthorities[authority];
    }

    /* 
    *  @dev Returns the ID mapped to the provided authority. Note that this call will never fail, but rather
    *  will return a zeroed-out Seal struct. We can check the ID value of this struct and know that this Seal
    *  is valid if it does not equal 0.
    *
    *  @param id: The ID of the Seal info to index.
    */
    function idToSealInfo(uint id) 
        public 
        view 
        returns (Seal memory) 
    {
        return _sealInfos[id];
    }

    /*
    *  @dev see:
    */ 
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) 
        internal
        override(ERC721, ERC721Enumerable) 
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }
    
    /*
    *  @dev see:
    */ 
    function supportsInterface(bytes4 interfaceId)
        public view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    /*
    *  @dev see:
    */ 
    function _burn(uint256 tokenId)
        internal virtual
        override(ERC721, ERC721URIStorage)
    {
        return super._burn(tokenId);
    }
    
    /*
    *  @dev see:
    */ 
    function tokenURI(uint256 tokenId)
        public view virtual 
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}