import json
import pytest

CASE_ID = "a" * 64


def test_two_party_lifecycle(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy("contracts/deposit_review.py")
    direct_vm.sender = direct_alice
    contract.open_case(CASE_ID, "0x" + direct_bob.hex(), "USD",
                       '[{"name":"Fixture","cents":8500}]', 600, 600)
    contract.add_record(CASE_ID, 0, "inventory", "Working handle B-14", "1" * 64, 0)
    contract.add_record(CASE_ID, 0, "move_out", "Broken handle B-14", "2" * 64, 0)
    contract.add_record(CASE_ID, 0, "invoice", "Replace handle B-14 USD 85.00", "3" * 64, 0)
    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("Only case participants"):
        contract.close_phase(CASE_ID)
    direct_vm.sender = direct_bob
    contract.endorse_inventory(CASE_ID, 1)
    contract.close_phase(CASE_ID)
    direct_vm.sender = direct_alice
    contract.close_phase(CASE_ID)
    direct_vm.sender = direct_bob
    contract.add_record(CASE_ID, 0, "response", "The invoice refers to B-14", "4" * 64, 3)
    contract.close_phase(CASE_ID)
    direct_vm.sender = direct_alice
    contract.close_phase(CASE_ID)
    direct_vm.mock_llm("fictional rental deduction", '{"finding":"DAMAGE_SUPPORTED","cents":8500,"refs":[3,2,1]}')
    contract.review(CASE_ID)
    result = json.loads(contract.get_case(CASE_ID))
    assert result["phase"] == "FINALIZED"
    assert result["decision"]["supported_cents"] == 8500
    assert result["decision"]["items"][0]["refs"] == [1, 2, 3]
    assert direct_vm.run_validator()
    assert not direct_vm.run_validator(leader_result=[])
