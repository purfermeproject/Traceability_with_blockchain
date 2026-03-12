"""
Blockchain Service
==================
Handles interaction with Ethereum-compatible blockchains.
Orchestrates: Transaction signing → Submission → Receipt tracking.
"""
import logging
from typing import Optional
from web3 import Web3
from web3.middleware import geth_poa_middleware
from app.core.config import settings

logger = logging.getLogger(__name__)

class BlockchainService:
    def __init__(self):
        self.rpc_url = getattr(settings, "BLOCKCHAIN_RPC_URL", None)
        self.contract_address = getattr(settings, "CONTRACT_ADDRESS", None)
        self.private_key = getattr(settings, "BLOCKCHAIN_PRIVATE_KEY", None)
        
        self.w3 = None
        self.contract = None
        
        if self.rpc_url:
            try:
                self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
                # Inject middleware for PoA networks (like Polygon or private Geth)
                self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
                
                if self.contract_address:
                    self.contract = self.w3.eth.contract(
                        address=self.contract_address,
                        abi=self.get_abi()
                    )
            except Exception as e:
                logger.error(f"Failed to initialize Web3: {e}")

    def get_abi(self):
        # Simplified ABI for recordBatch(string, string)
        return [
            {
                "inputs": [
                    {"internalType": "string", "name": "_batchId", "type": "string"},
                    {"internalType": "string", "name": "_batchHash", "type": "string"}
                ],
                "name": "recordBatch",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "string", "name": "_batchId", "type": "string"}
                ],
                "name": "getRecord",
                "outputs": [
                    {"internalType": "string", "name": "", "type": "string"},
                    {"internalType": "uint256", "name": "", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ]

    async def anchor_batch(self, batch_id: str, batch_hash: str) -> Optional[str]:
        """
        Submits the batch hash to the blockchain and returns the transaction ID.
        """
        if not self.w3 or not self.contract or not self.private_key:
            logger.warning("Blockchain service not fully configured. Skipping on-chain record.")
            return None

        try:
            account = self.w3.eth.account.from_key(self.private_key)
            nonce = self.w3.eth.get_transaction_count(account.address)
            
            # Build transaction
            txn = self.contract.functions.recordBatch(
                batch_id, 
                batch_hash
            ).build_transaction({
                'chainId': self.w3.eth.chain_id,
                'gas': 2000000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': nonce,
            })
            
            # Sign and send
            signed_txn = self.w3.eth.account.sign_transaction(txn, private_key=self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            return self.w3.to_hex(tx_hash)
            
        except Exception as e:
            logger.error(f"Blockchain submission failed for batch {batch_id}: {e}")
            return None

# Singleton instance
blockchain_service = BlockchainService()
