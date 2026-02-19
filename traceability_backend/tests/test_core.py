"""
Unit Tests — JWT, State Machine, Ingredient Tolerance, RBAC
"""
import pytest
from datetime import timezone, datetime, timedelta

from jose import jwt

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.hashing import hash_password, verify_password
from app.state_machine.batch_lifecycle import BatchStateMachine, PERCENTAGE_TOLERANCE


# ── JWT Tests ─────────────────────────────────────────────────────────────────
class TestJWT:
    def test_access_token_type(self):
        token = create_access_token("user-123")
        payload = decode_token(token)
        assert payload["type"] == "access"
        assert payload["sub"] == "user-123"

    def test_refresh_token_type(self):
        token = create_refresh_token("user-abc")
        payload = decode_token(token)
        assert payload["type"] == "refresh"

    def test_access_token_not_accepted_as_refresh(self):
        """An access token must not have type='refresh'."""
        token = create_access_token("user-xyz")
        payload = decode_token(token)
        assert payload["type"] != "refresh"

    def test_invalid_token_raises(self):
        from jose import JWTError
        with pytest.raises(JWTError):
            decode_token("invalid.token.here")

    def test_expired_token_raises(self):
        from jose import JWTError, jwt as jose_jwt
        expired_payload = {
            "sub": "user-999",
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
            "type": "access",
        }
        token = jose_jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        with pytest.raises(JWTError):
            decode_token(token)


# ── Hashing Tests ─────────────────────────────────────────────────────────────
class TestHashing:
    def test_hash_and_verify(self):
        plain = "MySuperSecret@123"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed)

    def test_wrong_password_fails(self):
        hashed = hash_password("correct-horse")
        assert not verify_password("wrong-horse", hashed)


# ── State Machine Tests ───────────────────────────────────────────────────────
class FakeBatchIngredient:
    def __init__(self, ingredient_id, pct, crop_cycle_id=None, vendor_id=None):
        self.ingredient_id = ingredient_id
        self.actual_percentage = pct
        self.crop_cycle_id = crop_cycle_id
        self.vendor_id = vendor_id


class FakeBatch:
    def __init__(self, status, ingredients):
        from app.models.batch import BatchStatus
        self.status = status
        self.batch_code = "TST-001"
        self.batch_ingredients = ingredients


class TestStateMachine:
    def _make_batch(self, percentages, statuses=None):
        from app.models.batch import BatchStatus
        ings = []
        for i, pct in enumerate(percentages):
            ings.append(FakeBatchIngredient(f"ing-{i}", pct, vendor_id=f"v-{i}"))
        return FakeBatch(BatchStatus.DRAFT, ings)

    def test_valid_100_percent(self):
        batch = self._make_batch([40.0, 35.0, 25.0])
        errors = BatchStateMachine.validate_for_lock(batch)
        assert errors == []

    def test_tolerance_999_allowed(self):
        """99.9% is within ±0.1 tolerance (Q2)."""
        batch = self._make_batch([40.0, 35.0, 24.9])
        errors = BatchStateMachine.validate_for_lock(batch)
        assert errors == []

    def test_95_percent_blocked(self):
        """95% should be blocked."""
        batch = self._make_batch([40.0, 35.0, 20.0])
        errors = BatchStateMachine.validate_for_lock(batch)
        assert any("95" in e for e in errors)

    def test_no_ingredients_blocked(self):
        from app.models.batch import BatchStatus
        batch = FakeBatch(BatchStatus.DRAFT, [])
        errors = BatchStateMachine.validate_for_lock(batch)
        assert len(errors) > 0

    def test_locked_batch_raises_on_edit(self):
        from fastapi import HTTPException
        from app.models.batch import BatchStatus
        batch = FakeBatch(BatchStatus.LOCKED, [])
        with pytest.raises(HTTPException) as exc_info:
            BatchStateMachine.assert_editable(batch)
        assert exc_info.value.status_code == 409

    def test_no_source_blocked(self):
        """Ingredient with no crop_cycle_id and no vendor_id must fail."""
        from app.models.batch import BatchStatus
        ing = FakeBatchIngredient("ing-0", 100.0, crop_cycle_id=None, vendor_id=None)
        batch = FakeBatch(BatchStatus.DRAFT, [ing])
        errors = BatchStateMachine.validate_for_lock(batch)
        assert any("no source" in e.lower() for e in errors)
