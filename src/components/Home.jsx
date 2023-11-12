import './Home.css'
import contractAbi from '../constants'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';

const contractAddress = "0x1fD6567F326d90771702BBb27E5978D033A1589e";

export default function Home() {
    const [currentAccount, setCurrentAccount] = useState("");
    const [contractInstance, setContractInstance] = useState('');
    const [tokenBalance, setTokenBalance] = useState(0);
    const [weiAmount, setWeiAmount] = useState("");
    const [stakeAmount, setStakeAmount] = useState("");
    const [message, setMessage] = useState("");
    const [isMember, setIsMember] = useState(false);
    const [description, setDescription] = useState("");
    const [proposals, setProposals] = useState([]);

    useEffect(() => {
        const loadBlockchainData = async () => {
            if (typeof window.ethereum !== 'undefined') {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                try {
                    const signer = provider.getSigner();
                    const address = await signer.getAddress();
                    setCurrentAccount(address)
                    window.ethereum.on('accountsChanged', (newAccounts) => {
                        setCurrentAccount(newAccounts[0]);
                        updateTokenBalance(newAccounts[0]);
                    });
                    const contract = new ethers.Contract(contractAddress, contractAbi, signer);
                    setContractInstance(contract);
                } catch (err) {
                    console.error(err);
                }
            }
        }
        loadBlockchainData();

    }, []);

    useEffect(() => {
        if (currentAccount && contractInstance) {
            checkMembershipStatus();
            updateTokenBalance(currentAccount);
            fetchProposals();
        }
    }, [currentAccount, contractInstance]);


    const updateTokenBalance = async (address) => {
        if (contractInstance && address) {
            const balance = await contractInstance.balanceOf(address);
            const formattedBalance = ethers.utils.formatEther(balance);
            setTokenBalance(formattedBalance);
        }
    }

    const buyTokens = async () => {
        try {
            const weiValue = ethers.utils.parseUnits(weiAmount, "wei");
            const tx = await contractInstance.buyTokens({
                value: weiValue,
            });
            await tx.wait();
            updateTokenBalance(currentAccount);
            setWeiAmount("");
        } catch (error) {
            console.error("Error buying tokens:", error);
        }
    }

    const stakeTokens = async () => {
        if (!stakeAmount || isNaN(stakeAmount)) {
            setMessage("Please enter a valid stake amount.");
            return;
        }

        const stakeAmountTokens = parseFloat(stakeAmount);

        if (stakeAmountTokens < 100) {
            setMessage("Minimum stake required: 100 tokens");
            return;
        }

        try {
            const tx = await contractInstance.becomeMember(stakeAmountTokens);
            await tx.wait();
            updateTokenBalance(currentAccount);
            window.alert(`Successfully staked ${stakeAmountTokens} tokens.`);
            checkMembershipStatus();
        } catch (error) {
            console.error("Error staking tokens:", error);
            setMessage(`Error staking tokens: ${error.message}`);
        }
    }

    const checkMembershipStatus = async () => {
        if (contractInstance && currentAccount) {
            const userIsMember = await contractInstance.members(currentAccount);
            setIsMember(userIsMember >= ethers.utils.parseUnits("100", "ether"));
        }
    };

    const handleDescriptionChange = (event) => {
        setDescription(event.target.value);
    };

    const createProposal = async () => {
        if (description.trim() === "") {
            setMessage("Proposal description cannot be empty.")
            return;
        }
        try {
            const tx = await contractInstance.createProposal(description);
            await tx.wait();
            fetchProposals();
            setDescription("");
            updateTokenBalance(currentAccount);
            window.alert("Proposal created successfully.");
        } catch (error) {
            console.error("Error creating proposal:", error);
            setMessage(`Error creating proposal: ${error.message}`);
        }
    };

    const fetchProposals = async () => {
        if (contractInstance) {
            try {
                const proposalsData = await contractInstance.getProposals();
                setProposals(proposalsData);
            } catch (error) {
                console.error("Error fetching proposals:", error);
            }
        }
    };

    return (
        <div >
            <div className="nav">
                <h1>DAO for content moderation</h1>
                <p><b>Your address:</b> {currentAccount}</p>
            </div>

            <div className="button-section">
                <div className="buy-tokens-section">
                    <p><b>Your token balance: {tokenBalance}</b></p>
                    <p>Transaction rate: <b>1 wei - 1 token</b></p>
                    <label htmlFor="buytokens">Want to buy tokens: </label>
                    <input
                        type="number"
                        placeholder="Enter amount in wei"
                        id='buytokens'
                        value={weiAmount}
                        onChange={(e) => setWeiAmount(e.target.value)}
                    />
                    <button onClick={buyTokens}>Buy Tokens</button>
                </div>
                <div className="become-member-section">
                    {isMember ? <p><b>You are a member of the DAO.</b></p> : <p><b>You are not a member</b></p>}
                    {!isMember && <p>Want to become a member of the DAO?? Stake a minimum of 100 tokens</p>}
                    {!isMember && <div>
                        <label htmlFor="stakeAmount">Stake Tokens for DAO: </label>
                        <input
                            type="number"
                            placeholder="Tokens to Stake"
                            id='stakeAmount'
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                        />
                        <button onClick={stakeTokens}>Stake</button>
                        <p style={{ color: 'red' }}>{message}</p>
                    </div>}
                </div>
            </div>
            <br />
            <div>
                <h2>Create Proposal</h2>
                <textarea
                    rows="4"
                    cols="50"
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="Enter your proposal description"
                />
                <button onClick={createProposal}>Create Proposal</button>
                <p style={{ color: 'red' }}>{message}</p>
            </div>
            {proposals.length > 0 && (
                <div>
                    <h2>Proposals</h2>
                    <table className="proposals-table">
                        <thead>
                            <tr>
                                <th>Proposal Creator</th>
                                <th>Proposal Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proposals.map((proposal, index) => {
                                if (!proposal.isAccepted) {
                                    return (
                                        <tr key={index}>
                                            <td>{proposal.creator}</td>
                                            <td>
                                                <Link to={`/proposals/${index}`} state={{ proposal: proposal, currentAccount: currentAccount }}>
                                                    {proposal.description}
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                } else {
                                    return null;
                                }
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

