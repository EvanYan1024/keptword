"""KeptWord integration tests: real web evidence + real LLM validators.

Run with: gltest tests/integration/test_kept_word.py -v -s --network studionet
"""

import time

import pytest
from gltest import get_contract_factory, get_default_account
from gltest.assertions import tx_execution_succeeded

EVIDENCE_URL = "https://github.com/genlayerlabs/genlayer-js/releases"
BENEFICIARY = "0x" + "22" * 20
BOND = 10**18


def _deadline_in(seconds: int) -> int:
    return int(time.time()) + seconds


@pytest.mark.integration
def test_real_evidence_kept_early_and_broken_after_deadline():
    contract = get_contract_factory("KeptWord").deploy()

    # Pledge A: true today -> the pledger can prove it before the deadline.
    tx = contract.create_pledge(
        args=[
            "The genlayer-js project publishes at least one tagged GitHub release.",
            EVIDENCE_URL,
            _deadline_in(86400),
            BENEFICIARY,
        ]
    ).transact(value=BOND)
    assert tx_execution_succeeded(tx)

    # Pledge B: false -> after a short deadline anyone can settle it as broken.
    short_deadline = _deadline_in(90)
    tx = contract.create_pledge(
        args=[
            "The genlayer-js project publishes release version 99.0.0.",
            EVIDENCE_URL,
            short_deadline,
            BENEFICIARY,
        ]
    ).transact(value=BOND)
    assert tx_execution_succeeded(tx)
    assert contract.get_pledge_count(args=[]).call() == 2

    tx = contract.resolve(args=["0"]).transact(wait_interval=10000, wait_retries=30)
    assert tx_execution_succeeded(tx)
    kept = contract.get_pledge(args=["0"]).call()
    print("pledge 0:", kept["status"], "-", kept["reason"])
    assert kept["status"] == "kept"
    assert kept["pledger"].lower() == get_default_account().address.lower()

    time.sleep(max(0, short_deadline - int(time.time())) + 5)
    tx = contract.resolve(args=["1"]).transact(wait_interval=10000, wait_retries=30)
    assert tx_execution_succeeded(tx)
    broken = contract.get_pledge(args=["1"]).call()
    print("pledge 1:", broken["status"], "-", broken["reason"])
    assert broken["status"] == "broken"
