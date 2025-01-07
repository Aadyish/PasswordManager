import React, { useState } from "react";
import { ethers } from "ethers";
import abi from "./contracts/PasswordManagerABI.json";
import "./App.css";

const contractAddress = "0xcEAa0Fedf6cD76B427409cb6F4B8B271692336Ab";

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [websiteName, setWebsiteName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [storedPasswords, setStoredPasswords] = useState([]);
  const [contract, setContract] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        setWalletAddress(await signer.getAddress());

        const contractInstance = new ethers.Contract(contractAddress, abi, signer);
        setContract(contractInstance);

        setMessage("Wallet connected successfully!");
      } catch (error) {
        console.error("Wallet connection failed:", error);
        setMessage("Failed to connect wallet.");
      }
    } else {
      setMessage("MetaMask not detected. Please install it.");
    }
  };

  const addPassword = async () => {
    if (!walletAddress) {
      setMessage("Please connect your wallet first.");
      return;
    }
    if (!websiteName || !username || !password) {
      setMessage("Please fill in all fields.");
      return;
    }
    if (!contract) {
      setMessage("Contract instance not found. Please reconnect your wallet.");
      return;
    }
    try {
      const tx = await contract.addPassword(websiteName, username, password);
      setMessage("Adding password...");
      await tx.wait();
      setMessage("Password added successfully");
      setWebsiteName("");
      setUsername("");
      setPassword("");
      fetchStoredPasswords();
    } catch (error) {
      console.error("Error adding password:", error);
      setMessage(`Failed to add password: ${error.reason || error.message}`);
    }
  };

  const fetchStoredPasswords = async () => {
    if (!walletAddress) {
      setMessage("Please connect your wallet first.");
      return;
    }
    if (!contract) {
      setMessage("Contract instance not found. Please reconnect your wallet.");
      return;
    }
    try {
      const passwordCount = await contract.getPasswordCount(walletAddress);
      if (passwordCount === 0) {
        setMessage("No passwords stored yet.");
        setStoredPasswords([]);
        return;
      }
      const passwords = [];
      for (let i = 0; i < passwordCount; i++) {
        const [website, user, pass] = await contract.getPassword(walletAddress, i);
        passwords.push({ website, username: user, password: pass, showPassword: false });
      }
      setStoredPasswords(passwords);
      setMessage("Passwords fetched");
    } catch (error) {
      console.error("Error retrieving passwords:", error);
      setMessage("Failed to retrieve stored passwords.");
    }
  };

  const toggleShowPassword = (index) => {
    setStoredPasswords((prevPasswords) =>
      prevPasswords.map((item, idx) =>
        idx === index ? { ...item, showPassword: !item.showPassword } : item
      )
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Decentralised Password Manager</h1>
        <div className="wallet-section">
          {!walletAddress ? (
            <button className="connect-btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          ) : (
            <h5>
              Connected Account:{walletAddress}
            </h5>
          )}
        </div>
        <div className="form-section">
          <input
            className="input-field"
            type="text"
            placeholder="Website Name"
            value={websiteName}
            onChange={(e) => setWebsiteName(e.target.value)}
          />
          <input
            className="input-field"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="input-field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div><br></br>
        <button className="primary-btn" onClick={addPassword}>
            Add Password
          </button>
        <button className="secondary-btn" onClick={fetchStoredPasswords}>
          Retrieve Passwords
        </button>
        {message && <p className="message">{message}</p>}
        <div className="password-list">
          <h2></h2>
          {storedPasswords.length === 0 ? (
            <p></p>
          ) : (
            storedPasswords.map((item, index) => (
              <div key={index} className="password-item">
                <p>
                  <strong>Website:</strong> {item.website}
                </p>
                <p>
                  <strong>Username:</strong> {item.username}
                </p>
                <p>
                  <strong>Password:</strong>{" "}
                  {item.showPassword ? item.password : "••••••••"}
                </p>
                <button
                    className="toggle-btn"
                    onClick={() => toggleShowPassword(index)}
                  >
                    {item.showPassword ? "Hide" : "Show"}
                  </button>
              </div>
            ))
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
