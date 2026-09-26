"""Direct mode tests for the KeptWord accountability bond contract."""

import json

import pytest

CONTRACT = "contracts/kept_word.py"
EVIDENCE_URL = "https://github.com/acme/app/releases"
BENEFICIARY = "0x" + "22" * 20
BOND = 3 * 10**18

T0 = "2026-01-01T00:00:00Z"
T0_TS = 1767225600
DEADLINE_TS = T0_TS + 7 * 86400  # 2026-01-08
BEFORE_DEADLINE = "2026-01-05T00:00:00Z"
AFTER_DEADLINE = "2026-01-09T00:00:00Z"
AFTER_DEADLINE_TS = T0_TS + 8 * 86400


@pytest.fixture
def sent(direct_vm):
    """Capture outbound EthSend transfers, which direct mode otherwise drops."""
    transfers = []

    def hook(vm, request):
        if "EthSend" in request:
            data = request["EthSend"]
            transfers.append((bytes(data["address"].as_bytes), int(data["value"])))
            return {"ok": None}
        return None

    direct_vm._gl_call_hook = hook
    return transfers


def _addr(a):
    return bytes(a.as_bytes) if hasattr(a, "as_bytes") else bytes(a)


def _create(vm, contract, pledger, statement="Ship v1.0 with public release notes"):
    vm.sender = pledger
    vm.value = BOND
    vm.warp(T0)
    pledge_id = contract.create_pledge(statement, EVIDENCE_URL, DEADLINE_TS, BENEFICIARY)
    vm.value = 0
    return pledge_id


def _mock_verdict(vm, kept, reason="cited release v1.0"):
    vm.mock_web(r".*github\.com/acme/app/releases.*", {"status": 200, "body": "v1.0 released 2026-01-06"})
    vm.mock_llm(r".*impartial adjudicator.*", json.dumps({"kept": kept, "reason": reason}))


# --- create_pledge ---------------------------------------------------------


def test_create_pledge_stores_fields(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice)

    p = c.get_pledge(pid)
    assert pid == "0"
    assert _addr(direct_alice) == bytes.fromhex(p["pledger"][2:])
    assert p["beneficiary"] == "0x2222222222222222222222222222222222222222"
    assert p["statement"] == "Ship v1.0 with public release notes"
    assert p["evidence_url"] == EVIDENCE_URL
    assert p["deadline"] == DEADLINE_TS
    assert p["bond"] == BOND
    assert p["status"] == "active"
    assert p["created_at"] == T0_TS
    assert p["resolved_at"] == 0
    assert c.get_pledge_count() == 1


def test_pledge_ids_increment(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = direct_deploy(CONTRACT)
    assert _create(direct_vm, c, direct_alice) == "0"
    assert _create(direct_vm, c, direct_bob, "Publish audit report") == "1"
    assert c.get_pledge_count() == 2
    assert [p["id"] for p in c.get_pledges()] == ["0", "1"]


@pytest.mark.parametrize(
    "value,statement,url,deadline,beneficiary,error",
    [
        (0, "Ship v1", EVIDENCE_URL, DEADLINE_TS, BENEFICIARY, "Bond must be greater than zero"),
        (BOND, "   ", EVIDENCE_URL, DEADLINE_TS, BENEFICIARY, "Statement must be 1-500"),
        (BOND, "x" * 501, EVIDENCE_URL, DEADLINE_TS, BENEFICIARY, "Statement must be 1-500"),
        (BOND, "Ship v1", "http://insecure.example.com", DEADLINE_TS, BENEFICIARY, "must be https://"),
        (BOND, "Ship v1", "https://e.com/" + "a" * 300, DEADLINE_TS, BENEFICIARY, "must be https://"),
        (BOND, "Ship v1", EVIDENCE_URL, T0_TS, BENEFICIARY, "Deadline must be in the future"),
    ],
)
def test_create_pledge_rejects_invalid_input(
    direct_vm, direct_deploy, direct_alice, value, statement, url, deadline, beneficiary, error
):
    c = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    direct_vm.value = value
    direct_vm.warp(T0)
    with direct_vm.expect_revert(error):
        c.create_pledge(statement, url, deadline, beneficiary)
    assert c.get_pledge_count() == 0


def test_statement_at_max_length_accepted(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice, "x" * 500)
    assert len(c.get_pledge(pid)["statement"]) == 500


def test_beneficiary_cannot_be_pledger(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    direct_vm.value = BOND
    direct_vm.warp(T0)
    with direct_vm.expect_revert("Beneficiary cannot be the pledger"):
        c.create_pledge("Ship v1", EVIDENCE_URL, DEADLINE_TS, "0x" + _addr(direct_alice).hex())


# --- resolve ---------------------------------------------------------------


def test_kept_after_deadline_refunds_pledger(direct_vm, direct_deploy, direct_alice, direct_bob, sent):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice)
    direct_vm.warp(AFTER_DEADLINE)
    _mock_verdict(direct_vm, True)

    direct_vm.sender = direct_bob  # anyone may resolve after the deadline
    c.resolve(pid)

    p = c.get_pledge(pid)
    assert p["status"] == "kept"
    assert p["reason"] == "cited release v1.0"
    assert p["resolved_at"] == AFTER_DEADLINE_TS
    assert sent == [(_addr(direct_alice), BOND)]


def test_broken_after_deadline_pays_beneficiary(direct_vm, direct_deploy, direct_alice, direct_bob, sent):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice)
    direct_vm.warp(AFTER_DEADLINE)
    _mock_verdict(direct_vm, False, "no release found")

    direct_vm.sender = direct_bob
    c.resolve(pid)

    assert c.get_pledge(pid)["status"] == "broken"
    assert sent == [(bytes.fromhex("22" * 20), BOND)]


def test_pledger_can_prove_early(direct_vm, direct_deploy, direct_alice, sent):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice)
    direct_vm.warp(BEFORE_DEADLINE)
    _mock_verdict(direct_vm, True)

    c.resolve(pid)

    assert c.get_pledge(pid)["status"] == "kept"
    assert sent == [(_addr(direct_alice), BOND)]


def test_early_unproven_pledge_stays_active(direct_vm, direct_deploy, direct_alice, sent):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice)
    direct_vm.warp(BEFORE_DEADLINE)
    _mock_verdict(direct_vm, False, "not released yet")

    with direct_vm.expect_revert("stays active"):
        c.resolve(pid)

    assert c.get_pledge(pid)["status"] == "active"
    assert sent == []


def test_only_pledger_can_resolve_before_deadline(direct_vm, direct_deploy, direct_alice, direct_bob, sent):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice)
    direct_vm.warp(BEFORE_DEADLINE)
    direct_vm.sender = direct_bob

    with direct_vm.expect_revert("Only the pledger can resolve before the deadline"):
        c.resolve(pid)
    assert sent == []


def test_resolve_exactly_at_deadline_is_final(direct_vm, direct_deploy, direct_alice, direct_bob, sent):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice)
    direct_vm.warp("2026-01-08T00:00:00Z")  # == DEADLINE_TS
    _mock_verdict(direct_vm, False)

    direct_vm.sender = direct_bob
    c.resolve(pid)
    assert c.get_pledge(pid)["status"] == "broken"


def test_cannot_resolve_twice(direct_vm, direct_deploy, direct_alice, sent):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice)
    direct_vm.warp(AFTER_DEADLINE)
    _mock_verdict(direct_vm, True)
    c.resolve(pid)

    with direct_vm.expect_revert("Pledge already resolved"):
        c.resolve(pid)
    assert len(sent) == 1


def test_unknown_pledge(direct_vm, direct_deploy):
    c = direct_deploy(CONTRACT)
    with direct_vm.expect_revert("Pledge not found"):
        c.resolve("42")
    with direct_vm.expect_revert("Pledge not found"):
        c.get_pledge("42")


def test_string_boolean_verdict_is_coerced(direct_vm, direct_deploy, direct_alice, sent):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice)
    direct_vm.warp(AFTER_DEADLINE)
    direct_vm.mock_web(r".*github\.com.*", {"status": 200, "body": "v1.0 released"})
    direct_vm.mock_llm(r".*impartial adjudicator.*", json.dumps({"kept": "False", "reason": "late"}))

    c.resolve(pid)
    assert c.get_pledge(pid)["status"] == "broken"


def test_malformed_verdict_reverts_without_settling(direct_vm, direct_deploy, direct_alice, sent):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice)
    direct_vm.warp(AFTER_DEADLINE)
    direct_vm.mock_web(r".*github\.com.*", {"status": 200, "body": "v1.0 released"})
    direct_vm.mock_llm(r".*impartial adjudicator.*", json.dumps({"verdict": "yes"}))

    with direct_vm.expect_revert("[LLM_ERROR]"):
        c.resolve(pid)
    assert c.get_pledge(pid)["status"] == "active"
    assert sent == []


def test_empty_evidence_page_reverts(direct_vm, direct_deploy, direct_alice, sent):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice)
    direct_vm.warp(AFTER_DEADLINE)
    direct_vm.mock_web(r".*github\.com.*", {"status": 200, "body": "   "})

    with direct_vm.expect_revert("Evidence page is empty"):
        c.resolve(pid)
    assert c.get_pledge(pid)["status"] == "active"


# --- consensus -------------------------------------------------------------


def test_validator_agrees_on_same_decision_despite_different_reason(
    direct_vm, direct_deploy, direct_alice, sent
):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice)
    direct_vm.warp(AFTER_DEADLINE)
    _mock_verdict(direct_vm, True, "leader wording")
    c.resolve(pid)

    direct_vm.clear_mocks()
    _mock_verdict(direct_vm, True, "completely different validator wording")
    assert direct_vm.run_validator() is True


def test_validator_rejects_opposite_decision(direct_vm, direct_deploy, direct_alice, sent):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice)
    direct_vm.warp(AFTER_DEADLINE)
    _mock_verdict(direct_vm, True)
    c.resolve(pid)

    direct_vm.clear_mocks()
    _mock_verdict(direct_vm, False)
    assert direct_vm.run_validator() is False


def test_validator_rejects_forged_leader_result(direct_vm, direct_deploy, direct_alice, sent):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice)
    direct_vm.warp(AFTER_DEADLINE)
    _mock_verdict(direct_vm, False)
    c.resolve(pid)

    # A malicious leader claims "kept" although the evidence says otherwise.
    assert direct_vm.run_validator(leader_result={"kept": True, "reason": "trust me"}) is False


def test_validator_error_classification(direct_vm, direct_deploy, direct_alice, sent):
    c = direct_deploy(CONTRACT)
    pid = _create(direct_vm, c, direct_alice)
    direct_vm.warp(AFTER_DEADLINE)
    _mock_verdict(direct_vm, True)
    c.resolve(pid)

    # Leader hit a transient fetch failure, validator's own run succeeds -> disagree.
    assert direct_vm.run_validator(leader_error=Exception("[TRANSIENT] Evidence fetch failed: timeout")) is False

    # Both see a malformed LLM answer -> disagree to force leader rotation.
    direct_vm.clear_mocks()
    direct_vm.mock_web(r".*github\.com.*", {"status": 200, "body": "v1.0 released"})
    direct_vm.mock_llm(r".*impartial adjudicator.*", json.dumps({"verdict": "yes"}))
    assert direct_vm.run_validator(leader_error=Exception("[LLM_ERROR] Missing boolean 'kept'")) is False

    # Both see the same deterministic empty-page error -> agree.
    direct_vm.clear_mocks()
    direct_vm.mock_web(r".*github\.com.*", {"status": 200, "body": ""})
    assert direct_vm.run_validator(leader_error=Exception("[EXTERNAL] Evidence page is empty")) is True
