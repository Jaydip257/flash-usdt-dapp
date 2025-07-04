const CONTRACT_ADDRESS = "0xC47711d8b4Cba5D9Ccc4e498A204EA53c31779aD";
    let provider, signer, contract;
    let currentUserAddress = null;
    
    // Check if real transaction mode is enabled
    function isRealTransactionMode() {
      return document.getElementById('real-tx-mode').checked;
    }

    // Fill current user address in forms
    function fillCurrentAddress(formType) {
      if (!currentUserAddress) {
        alert("❌ Please connect your wallet first!");
        return;
      }
      
      if (formType === 'transfer') {
        document.getElementById('trans-to').value = currentUserAddress;
      }
    }

    // Update UI based on transaction mode
    function updateModeUI() {
      const simulationIndicator = document.getElementById('simulation-indicator');
      const realTxIndicator = document.getElementById('real-tx-indicator');
      
      if (isRealTransactionMode()) {
        simulationIndicator.style.display = 'none';
        realTxIndicator.style.display = 'block';
      } else {
        simulationIndicator.style.display = 'block';
        realTxIndicator.style.display = 'none';
      }
    }

    async function connect() {
      try {
        console.log("🚀 Connecting wallet...");
        updateStatus("🚀 Connecting wallet...", "info");
        
        if (!window.ethereum) {
          alert("❌ MetaMask not found! Please install MetaMask extension.");
          return;
        }
        
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts.length === 0) {
          alert("❌ No accounts found. Please unlock MetaMask.");
          return;
        }
        
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        
        const acc = await signer.getAddress();
        currentUserAddress = acc;
        
        document.getElementById("account").innerText = `${acc.slice(0,6)}...${acc.slice(-4)}`;
        
        // Get real ETH balance
        const ethBalance = await provider.getBalance(acc);
        const ethFormatted = ethers.utils.formatEther(ethBalance);
        
        // Set USDT balance from localStorage for simulation
        const usdtBalance = localStorage.getItem(`balance_${acc}`) || "1000000";
        document.getElementById("balance").innerText = `${parseFloat(usdtBalance).toLocaleString()} USDT | ${parseFloat(ethFormatted).toFixed(4)} ETH`;
        
        const mode = isRealTransactionMode() ? "Real Transaction" : "Simulation";
        updateStatus(`✅ Wallet connected successfully! (${mode} Mode)`, "success");
        
        console.log("✅ Wallet connected:", acc);
        console.log("ETH Balance:", ethFormatted);
        
      } catch (err) {
        console.error("Connection Error:", err);
        if (err.code === 4001) {
          updateStatus("❌ User rejected connection", "error");
        } else {
          updateStatus("❌ Connection failed: " + err.message, "error");
        }
      }
    }

    async function addToken() {
      try {
        console.log("🪙 Adding token to MetaMask...");
        updateStatus("🪙 Adding token to MetaMask...", "info");
        
        if (!window.ethereum) {
          alert("❌ MetaMask not found!");
          return;
        }

        if (!currentUserAddress) {
          alert("❌ Please connect your wallet first!");
          return;
        }

        const logoUrl = "https://assets.coingecko.com/coins/images/325/small/Tether-logo.png";
        
        const wasAdded = await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: CONTRACT_ADDRESS,
              symbol: 'USDT',
              decimals: 6,
              image: logoUrl,
            },
          },
        });
        
        if (wasAdded) {
          console.log('✅ USDT token added to MetaMask');
          updateStatus("✅ USDT token added to MetaMask!", "success");
          alert('🎉 Success!\n\nUSDT Token has been added to your MetaMask wallet!\n\nYou can now see USDT in your token list.');
        } else {
          updateStatus("❌ Token addition was declined", "error");
        }
        
      } catch (err) {
        console.error("Add Token Error:", err);
        alert('❌ Error adding token to MetaMask:\n\n' + err.message);
        updateStatus("❌ Error adding token", "error");
      }
    }

    async function transfer() {
      try {
        if (!signer) {
          alert("❌ Please connect your wallet first!");
          return;
        }
        
        const to = document.getElementById("trans-to").value.trim();
        const amt = document.getElementById("trans-amt").value.trim();
        
        if (!to || !amt) {
          alert("❌ Please fill in both address and amount");
          return;
        }
        
        if (!ethers.utils.isAddress(to)) {
          alert("❌ Invalid recipient address\n\nPlease enter a valid Ethereum address starting with 0x");
          return;
        }
        
        const amount = parseFloat(amt);
        if (isNaN(amount) || amount <= 0) {
          alert("❌ Invalid amount\n\nPlease enter a positive number");
          return;
        }
        
        const currentUser = await signer.getAddress();
        const isSelfTransfer = currentUser.toLowerCase() === to.toLowerCase();
        
        if (isRealTransactionMode()) {
          // REAL METAMASK TRANSACTION MODE
          await performRealTransaction(currentUser, to, amount, isSelfTransfer);
        } else {
          // SIMULATION MODE
          await performSimulationTransaction(currentUser, to, amount, isSelfTransfer);
        }
        
      } catch (err) {
        console.error("Transfer error:", err);
        updateStatus("❌ Transfer failed: " + err.message, "error");
      }
    }

    async function performRealTransaction(currentUser, to, amount, isSelfTransfer) {
      try {
        // Check ETH balance for gas
        const ethBalance = await provider.getBalance(currentUser);
        const ethFormatted = parseFloat(ethers.utils.formatEther(ethBalance));
        
        if (ethFormatted < 0.001) {
          alert(`❌ Insufficient ETH for gas fees!
          
Your ETH balance: ${ethFormatted.toFixed(6)} ETH
Required: ~0.001 ETH for gas

Please add some ETH to your wallet for transaction fees.`);
          return;
        }
        
        const transferType = isSelfTransfer ? "Real Self-Transfer" : "Real Transfer";
        
        const confirmTransfer = confirm(`🔗 Confirm ${transferType}

💰 Amount: ${amount.toLocaleString()} USDT (simulated)
📍 From: ${currentUser.slice(0,8)}...${currentUser.slice(-6)}
📍 To: ${to.slice(0,8)}...${to.slice(-6)}
⛽ Gas Fee: ~0.001 ETH (real)
🔗 This will create a REAL blockchain transaction

⚠️ You will pay actual ETH gas fees!
⚠️ This transaction will appear in MetaMask!

Click OK to proceed with real transaction.`);
        
        if (!confirmTransfer) {
          updateStatus("❌ Real transaction cancelled", "error");
          return;
        }
        
        console.log("🔗 Creating real blockchain transaction...");
        updateStatus("🔗 Creating real blockchain transaction...", "warning");
        
        // Create real ETH transaction with data field containing USDT transfer info
        const transactionData = ethers.utils.toUtf8Bytes(
          `USDT Transfer: ${amount} USDT to ${to}`
        );
        
        const tx = await signer.sendTransaction({
          to: to,
          value: ethers.utils.parseEther("0.001"), // Send small ETH amount
          data: ethers.utils.hexlify(transactionData),
          gasLimit: 21000
        });
        
        console.log("✅ Real transaction sent:", tx.hash);
        updateStatus("⏳ Waiting for confirmation...", "warning");
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        
        console.log("✅ Transaction confirmed:", receipt);
        
        // Update simulation balances
        const senderBalance = parseFloat(localStorage.getItem(`balance_${currentUser}`) || '1000000');
        const newSenderBalance = Math.max(0, senderBalance - amount);
        const recipientBalance = parseFloat(localStorage.getItem(`balance_${to}`) || '0');
        const newRecipientBalance = recipientBalance + amount;
        
        localStorage.setItem(`balance_${currentUser}`, newSenderBalance.toString());
        localStorage.setItem(`balance_${to}`, newRecipientBalance.toString());
        
        // Update UI
        const ethBalance = await provider.getBalance(currentUser);
        const ethFormatted = ethers.utils.formatEther(ethBalance);
        document.getElementById("balance").innerText = `${newSenderBalance.toLocaleString()} USDT | ${parseFloat(ethFormatted).toFixed(4)} ETH`;
        
        updateStatus("✅ Real transaction completed!", "success");
        
        document.getElementById("trans-to").value = "";
        document.getElementById("trans-amt").value = "";
        
        setTimeout(() => {
          alert(`🎉 Real ${transferType} Successful!

💰 USDT Amount: ${amount.toLocaleString()} USDT (simulated)
📍 From: ${currentUser.slice(0,8)}...${currentUser.slice(-6)}
📍 To: ${to.slice(0,8)}...${to.slice(-6)}
🔗 REAL Blockchain TX: ${tx.hash}
🏦 Block Number: ${receipt.blockNumber}
⛽ Gas Used: ${receipt.gasUsed.toString()}
⏰ Time: ${new Date().toLocaleString()}

✅ REAL BLOCKCHAIN TRANSACTION COMPLETED!
✅ This transaction is visible in MetaMask!
✅ You paid actual ETH gas fees
✅ Transaction is recorded on blockchain forever
${isSelfTransfer ? '🧪 Self-transfer for testing purposes' : ''}

🔍 Check your MetaMask transaction history!`);
        }, 2000);
        
      } catch (realTxErr) {
        console.error("Real transaction failed:", realTxErr);
        
        if (realTxErr.code === 4001) {
          updateStatus("❌ User rejected transaction", "error");
        } else if (realTxErr.code === -32603 || realTxErr.message.includes('insufficient funds')) {
          updateStatus("❌ Insufficient ETH for gas", "error");
          alert("❌ Insufficient ETH for gas fees!\n\nPlease add some ETH to your wallet.");
        } else {
          updateStatus("❌ Real transaction failed: " + realTxErr.message, "error");
          alert("❌ Real transaction failed:\n\n" + realTxErr.message);
        }
      }
    }

    async function performSimulationTransaction(currentUser, to, amount, isSelfTransfer) {
      const senderBalance = parseFloat(localStorage.getItem(`balance_${currentUser}`) || '1000000');
      if (senderBalance < amount) {
        alert(`❌ Insufficient balance!

Your balance: ${senderBalance.toLocaleString()} USDT
Trying to send: ${amount.toLocaleString()} USDT

Please enter a smaller amount.`);
        return;
      }
      
      const transferType = isSelfTransfer ? "Simulation Self-Transfer" : "Simulation Transfer";
      
      const confirmTransfer = confirm(`🧪 Confirm ${transferType}

💰 Amount: ${amount.toLocaleString()} USDT
📍 From: ${currentUser.slice(0,8)}...${currentUser.slice(-6)}
📍 To: ${to.slice(0,8)}...${to.slice(-6)}
🧪 Mode: Simulation (No real blockchain transaction)

⚠️ This will NOT appear in MetaMask
⚠️ No gas fees required

Click OK to proceed with simulation.`);
      
      if (!confirmTransfer) {
        updateStatus("❌ Simulation cancelled", "error");
        return;
      }
      
      console.log("🧪 Processing simulation...");
      updateStatus("🧪 Processing simulation...", "info");
      
      const txHash = "0x" + Date.now().toString(16) + Math.random().toString(16).substr(2, 40).padStart(40, '0');
      
      const newSenderBalance = senderBalance - amount;
      const recipientBalance = parseFloat(localStorage.getItem(`balance_${to}`) || '0');
      const newRecipientBalance = recipientBalance + amount;
      
      localStorage.setItem(`balance_${currentUser}`, newSenderBalance.toString());
      localStorage.setItem(`balance_${to}`, newRecipientBalance.toString());
      
      // Get current ETH balance for display
      const ethBalance = await provider.getBalance(currentUser);
      const ethFormatted = ethers.utils.formatEther(ethBalance);
      document.getElementById("balance").innerText = `${newSenderBalance.toLocaleString()} USDT | ${parseFloat(ethFormatted).toFixed(4)} ETH`;
      
      updateStatus("✅ Simulation completed!", "success");
      
      document.getElementById("trans-to").value = "";
      document.getElementById("trans-amt").value = "";
      
      setTimeout(() => {
        alert(`🎉 ${transferType} Successful!

💰 Amount: ${amount.toLocaleString()} USDT
📍 From: ${currentUser.slice(0,8)}...${currentUser.slice(-6)}
📍 To: ${to.slice(0,8)}...${to.slice(-6)}
🧪 Simulation Hash: ${txHash}
⏰ Time: ${new Date().toLocaleString()}

✅ Simulation completed successfully!
✅ Your new balance: ${newSenderBalance.toLocaleString()} USDT
✅ Recipient received: ${amount.toLocaleString()} USDT
${isSelfTransfer ? '🧪 Self-transfer for testing purposes' : ''}

⚠️ This transaction will NOT appear in MetaMask
⚠️ Enable "Real MetaMask TX" for blockchain transactions`);
      }, 1500);
    }

    function updateStatus(message, type = "info") {
      const statusEl = document.getElementById("status");
      statusEl.textContent = message;
      statusEl.className = type;
    }

    // Account change handler
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
          const currentUser = accounts[0];
          currentUserAddress = currentUser;
          
          if (provider) {
            const ethBalance = await provider.getBalance(currentUser);
            const ethFormatted = ethers.utils.formatEther(ethBalance);
            const usdtBalance = parseFloat(localStorage.getItem(`balance_${currentUser}`) || '1000000');
            document.getElementById("balance").innerText = `${usdtBalance.toLocaleString()} USDT | ${parseFloat(ethFormatted).toFixed(4)} ETH`;
          }
          
          document.getElementById("account").innerText = `${currentUser.slice(0,6)}...${currentUser.slice(-4)}`;
          console.log("Account changed, balance updated");
          updateStatus("✅ Account switched successfully!", "success");
        } else {
          currentUserAddress = null;
          document.getElementById("account").innerText = "Not connected";
          document.getElementById("balance").innerText = "0 USDT";
          updateStatus("❌ Wallet disconnected", "error");
        }
      });
    }

    // Initialize on page load
    window.addEventListener('load', () => {
      console.log("🚀 Flash USDT DApp with Real TX loaded successfully");
      updateModeUI();
    });
