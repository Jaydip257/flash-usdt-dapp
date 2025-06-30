const CONTRACT_ADDRESS = "0xC47711d8b4Cba5D9Ccc4e498A204EA53c31779aD";
let provider, signer, contract;

async function connect() {
  if (!window.ethereum) return alert("Install MetaMask");
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  const acc = await signer.getAddress();
  document.getElementById("account").innerText = acc;
  contract = new ethers.Contract(CONTRACT_ADDRESS, await fetch('abi.json').then(r=>r.json()), signer);
  listenBalance();
}

async function listenBalance() {
  const symbol = await contract.symbol();
  const decimals = await contract.decimals();
  const raw = await contract.balanceOf(await signer.getAddress());
  const bal = ethers.utils.formatUnits(raw, decimals);
  document.getElementById("balance").innerText = `${symbol} ≈ $${bal}`;
}

async function addToken() {
  const added = await window.ethereum.request({
    method: 'wallet_watchAsset',
    params: {
      type: 'ERC20',
      options: {
        address: CONTRACT_ADDRESS,
        symbol: await contract.symbol(),
        decimals: await contract.decimals(),
        image: window.location.origin + '/logo.svg',
      },
    },
  });
  alert(added ? 'Token added!' : 'Failed to add token.');
}

async function mint() {
  const to = document.getElementById("mint-to").value;
  const amt = document.getElementById("mint-amt").value;
  await contract.mint(to, ethers.utils.parseUnits(amt, await contract.decimals()));
  document.getElementById("status").innerText = `Minted ${amt}`;
  listenBalance();
}

async function transfer() {
  const to = document.getElementById("trans-to").value;
  const amt = document.getElementById("trans-amt").value;
  await contract.transfer(to, ethers.utils.parseUnits(amt, await contract.decimals()));
  document.getElementById("status").innerText = `Transferred ${amt}`;
  listenBalance();
}

async function setExpiry() {
  const to = document.getElementById("exp-to").value;
  const days = parseInt(document.getElementById("exp-days").value);
  await contract.setExpiry(to, days);
  document.getElementById("status").innerText = `Expiry set for ${to} in ${days} days`;
}

document.getElementById("connect-btn").onclick = connect;
document.getElementById("add-token-btn").onclick = addToken;
document.getElementById("mint-btn").onclick = mint;
document.getElementById("trans-btn").onclick = transfer;
document.getElementById("exp-btn").onclick = setExpiry;
