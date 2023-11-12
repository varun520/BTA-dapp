import './Home.css'
import contractAbi from '../constants'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers';
import Home from './Home';

const contractAddress = "0x33182D77FA9B8FA89F49cce8B7ef75Cc5a18b27e";

export default function Header(){
    const [currentAccount, setCurrentAccount] = useState("");
    const [contractInstance, setContractInstance] = useState('');

    useEffect(() => {
        const loadBlockchainData = async () => {
            if (typeof window.ethereum !== 'undefined') {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                try {
                    const signer = provider.getSigner();
                    const address = await signer.getAddress();
                    setCurrentAccount(address)
                    // console.log(address)
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


    return (
        <div>
            <div className="nav">
                <h1>DAO for content moderation</h1>
                <p><b>Your address:</b> {currentAccount}</p>
            </div>
            <Home contractInstance = {contractInstance} contractAddress = {contractAddress}/>
        </div>
    )
}