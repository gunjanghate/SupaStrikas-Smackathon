// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;

    struct EventData {
        string eventName;
        string date;
        string location;
        string seat;
        uint256 price;
    }

    mapping(uint256 => EventData) public ticketMetadata;
    mapping(uint256 => bool) public isClaimed; // QR scan state

    event TicketMinted(uint256 indexed tokenId, address indexed to);
    event TicketClaimed(uint256 indexed tokenId, address indexed by);

    constructor(
        address initialOwner
    ) ERC721("MintMyTicketTicket", "ACT") Ownable(initialOwner) {}

    function mintTicket(
        address to,
        string memory _eventName,
        string memory _date,
        string memory _location,
        string memory _seat,
        uint256 _price,
        string memory _tokenURI
    ) external returns (uint256) {
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

        emit TicketMinted(tokenId, to);

        nextTokenId++;
        return tokenId;
    }

    /// @notice Mark a ticket as claimed (QR scanned)
    function claimTicket(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "Ticket does not exist");
        require(!isClaimed[tokenId], "Already claimed");

        // Only the ticket owner or contract owner (event organizer) can claim
        require(
            msg.sender == ownerOf(tokenId) || msg.sender == owner(),
            "Not authorized to claim"
        );

        isClaimed[tokenId] = true;

        emit TicketClaimed(tokenId, msg.sender);
    }
}
