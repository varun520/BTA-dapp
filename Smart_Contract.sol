// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract DAO is ERC20{
    address public owner;
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }
    uint256 public minProposalStake = 50 * 10 ** 18;
    uint256 public minMembershipStake = 100 * 10 ** 18;

    struct Proposal {
        address creator;
        string description;
        uint256 upvotes;
        uint256 downvotes;
        bool isAccepted;
    }

    Proposal[] public proposals;

    function getProposals() public view returns (Proposal[] memory) {
        return proposals;
    }

    mapping(address => uint256) public members;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    constructor(uint256 initialSupply) ERC20("BAD", "TEST2") {
        owner = msg.sender;
        _mint(msg.sender, initialSupply * 10 ** uint256(decimals()));
    }

    receive() external payable {
        require(msg.value >= minProposalStake, "Insufficient membership stake");
    }

    function buyTokens() public payable {
        uint256 tokensToBuy = msg.value; // 1 wei buys 1 token
        require(tokensToBuy > 0, "You need to send some ether to buy tokens");
        _mint(msg.sender, tokensToBuy * 10 ** 18);
    }

    event ProposalCreated(address indexed creator, uint256 proposalId, string description);
    function createProposal(string memory description) external payable {
        require(balanceOf(msg.sender) >= 50 * 10 ** 18, "Insufficient proposal stake");
        proposals.push(Proposal({
            creator: msg.sender,
            description: description,
            upvotes: 0,
            downvotes: 0,
            isAccepted: false
        }));
        
        transfer(address(this), 50 * 10 ** 18);
        emit ProposalCreated(msg.sender, proposals.length - 1, description);
    }   

    function getVotesForProposal(uint256 proposalId) public view returns (uint256 upvotes, uint256 downvotes) {
        require(proposalId < proposals.length, "Invalid proposal ID");
        Proposal storage proposal = proposals[proposalId];
        upvotes = proposal.upvotes;
        downvotes = proposal.downvotes;
    }

    function becomeMember(uint stakeTokens) external payable {
        require(balanceOf(msg.sender) >= 100 * 10 ** 18, "Insufficient membership stake");
        require(stakeTokens >= 100, "Minimum hundred tokens require to get membership access");
        transfer(address(this), stakeTokens * 10 ** 18);
        members[msg.sender] = stakeTokens * 10 ** 18;
    }

    event Voted(address indexed voter, uint256 proposalId, bool isUpvote, uint256 votingWeight);
    function vote(uint256 proposalId, bool isUpvote) external {
        require(members[msg.sender] > 0, "Only members can vote");
        require(!hasVoted[proposalId][msg.sender], "You have already voted on this proposal");
        uint256 tokensHeld = members[msg.sender] / 10 ** 18;
        uint256 votingWeight = tokensHeld * tokensHeld;
        require(msg.sender != proposals[proposalId].creator, "The proposal creator cannot vote on their own proposal");
        if (isUpvote) {
            proposals[proposalId].upvotes += votingWeight;
        } else {
            proposals[proposalId].downvotes += votingWeight;
        }
    
        hasVoted[proposalId][msg.sender] = true;
        emit Voted(msg.sender, proposalId, isUpvote, votingWeight);
    }

    function finalizeProposal(uint256 proposalId) external onlyOwner{
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.isAccepted, "Proposal already accepted");
        if (proposal.upvotes > proposal.downvotes) {
            proposal.isAccepted = true;
            address payable creator = payable(proposal.creator);
            uint256 stakedAmount = minProposalStake;
            require(balanceOf(address(this)) >= stakedAmount, "Insufficient balance");
            _transfer(address(this), creator, stakedAmount);
        }
    }
}