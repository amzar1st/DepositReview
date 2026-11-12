# DepositReview

DepositReview reviews itemized rental deposit deductions with a fixed evidence policy. Both parties can submit redacted excerpts and SHA-256 commitments, endorse an inventory, and respond to opposing evidence. GenLayer validators independently evaluate each item and compare normalized findings, amounts and evidence IDs.

- [StudioNet contract](https://explorer-studio.genlayer.com/address/0x751a83a77A0BF05a72F535d93Db8a176CDB60f2A)
- [Live verification and instructions](docs/LIVE_VERIFICATION.md)

## Development

Install Node dependencies with `npm ci`, then run `npm run build`. Serve `dist/` over localhost for development. Install `genlayer-test==0.29.2` and `genvm-linter==0.11.0` in Python 3.12, then run `python -m pytest tests` and `genvm-lint check contracts/deposit_review.py`.

The frontend reads cases and tracks receipts with GenLayerJS. To sign with the built-in Studio account, import the contract source into Studio, attach the deployed address in Run and Debug, and submit the arguments prepared by the website. Use a different Studio account for the tenant.

Use fictional or redacted evidence. Case data is public. The original files are kept off-chain and the hash allows anyone who holds the file to check its bytes. An endorsement records agreement by the other wallet. The contract assesses excerpts and does not independently authenticate the original documents or move funds.
