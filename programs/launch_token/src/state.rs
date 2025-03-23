use anchor_lang::prelude::*;

#[account]
#[derive(Debug, InitSpace)]
pub struct Config {
    pub active: bool,
    pub admin: Pubkey,
    pub fee_account: Pubkey,
    pub tokens: u64,
    pub bump: u8,
}
