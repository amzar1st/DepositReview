# StudioNet verification

- Network: StudioNet 61999
- Contract: [0x751a83a77A0BF05a72F535d93Db8a176CDB60f2A](https://explorer-studio.genlayer.com/address/0x751a83a77A0BF05a72F535d93Db8a176CDB60f2A)
- Deployment: [finalized, GenVM success](https://explorer-studio.genlayer.com/tx/0x39b36ffe360778bf64380e42a6c668d4a70439ef1e42e14330a6b040dc637f18)
- Signer: Studio built-in account. The repository contract was recovered from the finalized deployment's Code tab.

The earlier prototype finalized [case creation](https://explorer-studio.genlayer.com/tx/0x492bc386cce9cbdd39a7562a4c0449de4a32688a37a52cb760c89baaab96dd60) and [evidence submission](https://explorer-studio.genlayer.com/tx/0x57f2f2beafff9780fd720e114d9ca44e3ba0f5587b50228d9e2c9b9fc20ae567). It exposed Studio's numeric encoding of Address inputs. The corrected deployment validates a hexadecimal tenant address passed as a string. The three-item fixture shown on the website illustrates expected findings. A finalized three-item consensus result on the corrected contract is still unverified.

## Reproduce

1. As the landlord, call open_case with a new 64-character lowercase hexadecimal ID, a distinct tenant address, USD, and items Fixture 8500, Carpet stain 12000, Kitchen cleaning 14000.
2. Add inventory for the fixture and have the tenant endorse it. Add fixture move-out and itemized replacement invoice. Add both inspections showing the same carpet stain. Add both kitchen inspections plus an invoice with a lump sum. For synthetic text records, hash the UTF-8 text itself.
3. Both participants call close_phase to start the response window. As the tenant, submit a response to the opposing carpet move-out record, then have both close their response phase.
4. Call review in full consensus mode. Inspect the finalized receipt and call get_case. The expected supported amount is USD 85.00, with the stain pre-existing and the cleaning charge unresolved.
