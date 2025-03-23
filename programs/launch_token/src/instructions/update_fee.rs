use anchor_lang::prelude::*;

use crate::{contants::CONFIG_SEED, error::LaunchTokenError, state::Config};

#[derive(Accounts)]
pub struct UpdateFee<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ LaunchTokenError::UnathorizedUser
    )]
    pub config: Account<'info, Config>,
    pub admin: Signer<'info>,
}

pub fn update_fee_handler(ctx: Context<UpdateFee>, new_fee: u64) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.fee_amount = new_fee;
    Ok(())
}
