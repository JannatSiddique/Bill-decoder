from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date

class Charge(BaseModel):
    type: str
    amount: float

    @field_validator('type')
    @classmethod
    def validate_charge_type(cls, v):
        allowed = {'energy', 'fixed', 'fpa', 'quarterly_adjustment', 'surcharge', 'meter_rent', 'subsidy', 'other'}
        if v not in allowed:
            raise ValueError(f"charge type must be one of {allowed}, got {v}")
        return v

class Tax(BaseModel):
    type: str
    amount: float

    @field_validator('type')
    @classmethod
    def validate_tax_type(cls, v):
        allowed = {'gst', 'electricity_duty', 'income_tax', 'municipal_tax', 'other_tax'}
        if v not in allowed:
            raise ValueError(f"tax type must be one of {allowed}, got {v}")
        return v

class BillLevel1(BaseModel):
    provider: str
    tariff: Optional[str]
    sanctioned_load_kw: Optional[float]
    bill_month: Optional[str]
    reading_date: Optional[str]
    issue_date: Optional[str]
    due_date: Optional[str]
    previous_reading: Optional[float]
    current_reading: Optional[float]
    units_consumed: Optional[float]
    charges: List[Charge]
    total_charges: Optional[float]
    taxes: List[Tax]
    total_taxes: Optional[float]
    current_bill: Optional[float]
    arrears: Optional[float]
    payable_within_due_date: Optional[float]
    payable_after_due_date: Optional[float]

    @field_validator('provider')
    @classmethod
    def validate_provider(cls, v):
        if v not in {'KE', 'LESCO', 'IESCO'}:
            raise ValueError(f"provider must be KE, LESCO, or IESCO, got {v}")
        return v
