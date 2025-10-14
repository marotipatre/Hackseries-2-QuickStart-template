from algopy import *
from algopy.arc4 import abimethod


class Bank(ARC4Contract):
    total_deposit: UInt64

    def __init__(self) -> None:
        """Initializes contract storages on deployment"""
        self.deposits = BoxMap(Account, UInt64, key_prefix="")
        self.total_deposit = UInt64(0)

    @abimethod()
    def deposit(self, memo: String, pay_txn: gtxn.PaymentTransaction) -> UInt64:
        """Accepts a payment into the app escrow and records sender's deposited balance"""
        assert pay_txn.receiver == Global.current_application_address, "Receiver must be the contract address"
        assert pay_txn.amount > 0, "Deposit amount must be greater than zero"

        amount, exists = self.deposits.maybe(pay_txn.sender)
        if exists:
            self.deposits[pay_txn.sender] = amount + pay_txn.amount
        else:
            self.deposits[pay_txn.sender] = pay_txn.amount

        self.total_deposit += pay_txn.amount
        return self.deposits[pay_txn.sender]

    @abimethod()
    def withdraw(self, amount: UInt64) -> UInt64:
        """Sends ALGO back to the caller from their recorded balance"""
        current, exists = self.deposits.maybe(Txn.sender)
        assert exists, "No deposits found for this account"
        assert amount > 0, "Withdrawal amount must be greater than zero"
        assert amount <= current, "Withdrawal amount exceeds balance"

        itxn.Payment(receiver=Txn.sender, amount=amount, fee=0).submit()

        remaining = current - amount
        if remaining == UInt64(0):
            del self.deposits[Txn.sender]
        else:
            self.deposits[Txn.sender] = remaining

        return remaining


