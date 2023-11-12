import { useLocation, useParams } from 'react-router-dom';
import contractAbi from '../constants'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import './ProposalDetails.css'
const contractAddress = "0x1fD6567F326d90771702BBb27E5978D033A1589e";

function ProposalDetails() {
    const [currentAccount, setCurrentAccount] = useState("");
    const [contractInstance, setContractInstance] = useState('');
    const [isMember, setIsMember] = useState(false);
    const [stakedTokens, setStakedTokens] = useState("0");
    const [upvotes, setUpvotes] = useState(0);
    const [downvotes, setDownvotes] = useState(0);
    const [isOwner, setIsOwner] = useState(false);

    const { id } = useParams();

    useEffect(() => {
        const loadBlockchainData = async () => {
            if (typeof window.ethereum !== 'undefined') {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                try {
                    const signer = provider.getSigner();
                    const address = await signer.getAddress();
                    setCurrentAccount(address)
                    const contract = new ethers.Contract(contractAddress, contractAbi, signer);
                    setContractInstance(contract);

                    const owner = await contract.owner();
                    setIsOwner(owner === address);

                    const newMemberTokens = await contract.members(address);
                    const memberTokensAsString = ethers.utils.formatUnits(newMemberTokens, 18);
                    setIsMember(parseFloat(memberTokensAsString) > 0);
                    setStakedTokens(memberTokensAsString);
                    window.ethereum.on('accountsChanged', async (newAccounts) => {
                        setCurrentAccount(newAccounts[0]);


                        const newAccount = newAccounts[0];
                        const owner = await contract.owner();

                        setIsOwner(owner.toLowerCase() === newAccount);

                        const newMemberTokens = await contract.members(newAccounts[0]);
                        const memberTokensAsString = ethers.utils.formatUnits(newMemberTokens, 18);
                        setIsMember(parseFloat(memberTokensAsString) > 0);
                        setStakedTokens(memberTokensAsString);

                    });

                } catch (err) {
                    console.error(err);
                }
            }
        }
        loadBlockchainData();

    }, []);

    useEffect(() => {
        fetchVotes();
    }, [contractInstance])



    const fetchVotes = async () => {
        if (contractInstance) {
            try {
                const { upvotes, downvotes } = await contractInstance.getVotesForProposal(id);
                setUpvotes(ethers.utils.formatUnits(upvotes, 0));
                setDownvotes(ethers.utils.formatUnits(downvotes, 0));
            } catch (err) {
                console.error(err);
            }
        }
    };

    const upVote = async () => {
        if (contractInstance) {
            try {
                const tx = await contractInstance.vote(id, true);
                tx.wait();
                setUpvotes(upvotes + (stakedTokens * stakedTokens));

            } catch (error) {
                console.error('Error upvoting:', error);

            }
        }
    };

    const downVote = async () => {
        if (contractInstance) {
            try {
                await contractInstance.vote(id, false);
                setDownvotes(downvotes + (stakedTokens * stakedTokens));
            } catch (error) {
                console.error('Error downvoting:', error);
                
            }
        }
    };

    const finalizeProposal = async () => {
        try {
            const tx = await contractInstance.finalizeProposal(id);
            await tx.wait();
            alert("Successfully Finalized")
            window.location.href = '/';
        } catch (error) {
            console.error('Error finalizing proposal:', error);
        }
    }

    const location = useLocation();
    const proposal = location.state?.proposal;

    if (!proposal) {
        return <div>Proposal not found</div>;
    }

    return (
        <div className='container'>
            <div className="nav">
                <h1>DAO for content moderation</h1>
                <p><b>Your address:</b> {currentAccount}</p>
            </div>
            {isMember && (
                <p><b>You are Member of DAO</b>,Staked Tokens: {stakedTokens}</p>
            )}
            {!isMember && (
                <p><b>You are not a member of DAO. Stake Tokens to participate in the Voting</b></p>
            )}
            <h2>Proposal Details</h2>
            <p>Proposal Description: {proposal.description}</p>
            <p>Proposal Creator: {proposal.creator}</p>
            <p>Weight of Upvotes: {upvotes}</p>
            <p>Weight of Downvotes: {downvotes}</p>
            {currentAccount === proposal.creator && <p><b>You cannot vote as you are the creatror</b></p>}

            <div>
                <button className={`upvote-button ${currentAccount === proposal.creator ? 'greyed-out-button' : ''}`} onClick={upVote} disabled={currentAccount.toLowerCase() === proposal.creator.toLowerCase()}>UpVote</button>
                <button className={`downvote-button ${currentAccount === proposal.creator ? 'greyed-out-button' : ''}`} onClick={downVote} disabled={currentAccount === proposal.creator}>DownVote</button>
                {isOwner && (
                    <button className='owner-button' onClick={finalizeProposal}>Finalize Proposal</button>
                )}
            </div>

            <Link to="/" className="link">Go Back to Home</Link>
        </div>
    );
}

export default ProposalDetails;

