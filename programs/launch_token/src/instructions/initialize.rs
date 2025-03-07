use crate::{contants::{ADMIN_PUBKEY, CONFIG_SEED}, error::LaunchTokenError, state::Config};

use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        mut,
        address = ADMIN_PUBKEY
        @LaunchTokenError::UnathorizedUser
    )]
    pub user: Signer<'info>,
    #[account(
        init, 
        seeds = [CONFIG_SEED],
        payer = user,
        space = 8 + Config::INIT_SPACE,
        bump,
    )]
    pub config: Box<Account<'info, Config>>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_handler(ctx: Context<Initialize>) -> Result<()> {
    ctx.accounts.config.bump = ctx.bumps.config;
    ctx.accounts.config.active = true;
    ctx.accounts.config.admin = ctx.accounts.user.key();
    ctx.accounts.config.fee_account = ctx.accounts.user.key();

    Ok(())
}
