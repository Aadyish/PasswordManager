import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// You can use your contract's ABI and deployed address here
const contractABI = [/* Your contract ABI here */];
const contractAddress = 0x6569C828639af259aB4F3Aca7A47194410926Cc4; // Replace with your deployed contract address

function PasswordManager() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [passwords, setPasswords] = useState([]);
  const [newPassword, setNewPassword] = useState({
    website: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    // Initialize Ethereum provider and contract instance
    const init = async () => {
      const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
      const ethSigner = ethProvider.getSigner();
      const ethContract = new ethers.Contract(contractAddress, contractABI, ethSigner);

      setProvider(ethProvider);
      setSigner(ethSigner);
      setContract(ethContract);

      // Request account access if needed
      await ethProvider.send('eth_requestAccounts', []);
    };

    init();
  }, []);

  const addPassword = async () => {
    const { website, username, password } = newPassword;
    if (!website || !username || !password) return;

    try {
      const encryptedPassword = ethers.utils.id(password); // Encrypt the password (this is just an example, use a real encryption method)
      const tx = await contract.addPassword(website, username, encryptedPassword);
      await tx.wait();
      alert('Password added!');
      loadPasswords();
    } catch (error) {
      console.error('Error adding password:', error);
    }
  };

  const loadPasswords = async () => {
    if (!contract) return;

    try {
      const count = await contract.getPasswordCount(await signer.getAddress());
      const passwordsArray = [];
      for (let i = 0; i < count; i++) {
        const [website, username, encryptedPassword] = await contract.getPassword(await signer.getAddress(), i);
        passwordsArray.push({ website, username, encryptedPassword });
      }
      setPasswords(passwordsArray);
    } catch (error) {
      console.error('Error loading passwords:', error);
    }
  };

  useEffect(() => {
    loadPasswords();
  }, [contract]);

  return (
    <div>
      <div>
        <h2>Add New Password</h2>
        <input
          type="text"
          placeholder="Website"
          value={newPassword.website}
          onChange={(e) => setNewPassword({ ...newPassword, website: e.target.value })}
        />
        <input
          type="text"
          placeholder="Username"
          value={newPassword.username}
          onChange={(e) => setNewPassword({ ...newPassword, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={newPassword.password}
          onChange={(e) => setNewPassword({ ...newPassword, password: e.target.value })}
        />
        <button onClick={addPassword}>Add Password</button>
      </div>

      <div>
        <h2>Stored Passwords</h2>
        {passwords.length === 0 ? (
          <p>No passwords stored yet.</p>
        ) : (
          <ul>
            {passwords.map((entry, index) => (
              <li key={index}>
                <strong>{entry.website}</strong> - {entry.username}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default PasswordManager;
