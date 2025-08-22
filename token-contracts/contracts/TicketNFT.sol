// SPDX-License-Identifier: MIT
// pragma solidity ^0.8.20;

// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";

// contract TicketNFT is ERC721URIStorage, Ownable {
//     uint256 public nextTokenId;

//     struct EventData {
//         string eventName;
//         string date;
//         string location;
//         string seat;
//         uint256 price;
//     }

//     mapping(uint256 => EventData) public ticketMetadata;
//     mapping(uint256 => bool) public isClaimed; // QR scan state

//     event TicketMinted(uint256 indexed tokenId, address indexed to);
//     event TicketClaimed(uint256 indexed tokenId, address indexed by);

//     constructor(
//         address initialOwner
//     ) ERC721("MintMyTicketTicket", "ACT") Ownable(initialOwner) {}

//     function mintTicket(
//         address to,
//         string memory _eventName,
//         string memory _date,
//         string memory _location,
//         string memory _seat,
//         uint256 _price,
//         string memory _tokenURI
//     ) external returns (uint256) {
//         uint256 tokenId = nextTokenId;
//         _safeMint(to, tokenId);
//         _setTokenURI(tokenId, _tokenURI);

//         ticketMetadata[tokenId] = EventData(
//             _eventName,
//             _date,
//             _location,
//             _seat,
//             _price
//         );

//         emit TicketMinted(tokenId, to);

//         nextTokenId++;
//         return tokenId;
//     }

//     /// @notice Mark a ticket as claimed (QR scanned)
//     function claimTicket(uint256 tokenId) external {
//         require(_ownerOf(tokenId) != address(0), "Ticket does not exist");
//         require(!isClaimed[tokenId], "Already claimed");

//         // Only the ticket owner or contract owner (event organizer) can claim
//         require(
//             msg.sender == ownerOf(tokenId) || msg.sender == owner(),
//             "Not authorized to claim"
//         );

//         isClaimed[tokenId] = true;

//         emit TicketClaimed(tokenId, msg.sender);
//     }
// }

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;
    uint256 public maxSupply; // Maximum number of NFTs
    uint256 public constant TRANSFER_FEE_PERCENTAGE = 10; // 10% fee for resales

    struct EventData {
        string eventName;
        string date;
        string location;
        string seat;
        uint256 price;
    }

    mapping(uint256 => EventData) public ticketMetadata;
    mapping(uint256 => bool) public isClaimed; // QR scan state
    mapping(uint256 => uint256) public resalePrice; // Price for NFTs listed for resale

    event TicketMinted(uint256 indexed tokenId, address indexed to, uint256 price);
    event TicketClaimed(uint256 indexed tokenId, address indexed by);

    event TicketListedForResale(uint256 indexed tokenId, uint256 price);
    event TicketResold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);
    event TicketTransferred(uint256 indexed tokenId, address indexed from, address indexed to);

    constructor(
        address initialOwner,
        uint256 _maxSupply
    ) ERC721("MintMyTicketTicket", "ACT") Ownable(initialOwner) {
        maxSupply = _maxSupply;
    }

    function mintTicket(
        address to,
        string memory _eventName,
        string memory _date,
        string memory _location,
        string memory _seat,
        uint256 _price,
        string memory _tokenURI
    ) external payable returns (uint256) {
        require(nextTokenId < maxSupply, "Maximum ticket supply reached");
        require(msg.value >= _price, "Insufficient payment");

        uint256 tokenId = nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        ticketMetadata[tokenId] = EventData(
            _eventName,
            _date,
            _location,
            _seat,
            _price
        );

        // Send payment to contract owner (deployer)
        payable(owner()).transfer(msg.value);

        emit TicketMinted(tokenId, to, _price);

        nextTokenId++;
        return tokenId;
    }

    /// @notice Mark a ticket as claimed (QR scanned)
function claimTicket(uint256 tokenId) external onlyOwner {
    require(_ownerOf(tokenId) != address(0), "Ticket does not exist");
    require(!isClaimed[tokenId], "Already claimed");
    isClaimed[tokenId] = true;
    emit TicketClaimed(tokenId, msg.sender);
}

    /// @notice List a ticket for resale
    function listTicketForResale(uint256 tokenId, uint256 price) external {
        require(_ownerOf(tokenId) != address(0), "Ticket does not exist");
        require(msg.sender == ownerOf(tokenId), "Not ticket owner");
        require(!isClaimed[tokenId], "Cannot resell claimed ticket");

        resalePrice[tokenId] = price;

        // Approve contract to handle transfer
        approve(address(this), tokenId);

        emit TicketListedForResale(tokenId, price);
    }

    /// @notice Buy a ticket listed for resale
    function buyResaleTicket(uint256 tokenId) external payable {
        require(_ownerOf(tokenId) != address(0), "Ticket does not exist");
        require(resalePrice[tokenId] > 0, "Ticket not listed for resale");
        require(!isClaimed[tokenId], "Cannot buy claimed ticket");
        require(msg.value >= resalePrice[tokenId], "Insufficient payment");

        address seller = ownerOf(tokenId);
        uint256 price = resalePrice[tokenId];
        
        // Calculate fee (10%)
        uint256 fee = (price * TRANSFER_FEE_PERCENTAGE) / 100;
        uint256 sellerProceeds = price - fee;

        // Clear resale listing
        resalePrice[tokenId] = 0;

        // Transfer funds
        payable(owner()).transfer(fee); // Fee to contract owner
        payable(seller).transfer(sellerProceeds); // Proceeds to seller

        // Transfer NFT
        _transfer(seller, msg.sender, tokenId);

        emit TicketResold(tokenId, seller, msg.sender, price);
    }

    /// @notice Transfer a ticket to a specified address
    /// @param to The address to transfer the ticket to
    /// @param tokenId The ID of the ticket to transfer
    function transferTicket(address to, uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "Ticket does not exist");
        require(msg.sender == ownerOf(tokenId), "Not ticket owner");
        require(to != address(0), "Cannot transfer to zero address");
        require(!isClaimed[tokenId], "Cannot transfer claimed ticket");

        // Clear resale listing if it exists
        if (resalePrice[tokenId] > 0) {
            resalePrice[tokenId] = 0;
            approve(address(0), tokenId); // Clear any existing approval
        }

        // Transfer the NFT
        _transfer(msg.sender, to, tokenId);

        emit TicketTransferred(tokenId, msg.sender, to);
    }

    /// @notice Get current resale price for a ticket
    function getResalePrice(uint256 tokenId) external view returns (uint256) {
        return resalePrice[tokenId];
    }
}